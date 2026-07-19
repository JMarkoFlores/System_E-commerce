import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import io
import os
import json
import datetime
import json
import datetime
from fpdf import FPDF

from data import generar_usuarios_sinteticos, estadisticas_dataset
from models import (
    RandomRecommender, 
    PopularityRecommender, 
    ContentBasedRecommender, 
    HybridWeightedRecommender, 
    HybridCascadeRecommender
)
from evaluation import evaluar_recomendador, comparar_con_baselines

st.set_page_config(page_title="Módulo de Pruebas - TechStore AI", layout="wide", page_icon="🧪")

st.title("🧪 Evaluación de Modelos de Recomendación")
st.markdown("Módulo avanzado de pruebas offline para los algoritmos del E-commerce.")

# --- Sidebar Configuration ---
with st.sidebar:
    st.header("Configuración de la Prueba")
    num_usuarios = st.number_input(
        "Usuarios Sintéticos", min_value=10, max_value=500, value=40, step=10,
        help="Cantidad de perfiles a simular. Más usuarios aumentan la fiabilidad estadística, pero tardan más en procesar."
    )
    top_k = st.number_input(
        "Top-K Recomendaciones", min_value=1, max_value=50, value=10, step=1,
        help="Número de productos a recomendar por usuario. Simula el límite de un carrusel en pantalla (ej. Top 10)."
    )
    seed = st.number_input(
        "Semilla Aleatoria", value=42,
        help="Fija la aleatoriedad. Mantener la misma semilla garantiza los mismos resultados exactos al repetir la prueba."
    )
    
    run_btn = st.button("Ejecutar Evaluación", type="primary", use_container_width=True)

if "resultados" not in st.session_state:
    st.session_state.resultados = None

# --- Ejecución ---
if run_btn:
    with st.spinner("Generando datos sintéticos..."):
        usuarios = generar_usuarios_sinteticos(cantidad=num_usuarios, semilla=seed)
        stats_dataset = estadisticas_dataset(usuarios)
        
    with st.spinner("Evaluando modelos..."):
        random_rec = RandomRecommender(seed=seed)
        popularity_rec = PopularityRecommender()
        content_rec = ContentBasedRecommender()
        hybrid_w_rec = HybridWeightedRecommender()
        hybrid_c_rec = HybridCascadeRecommender()
        
        res_random = evaluar_recomendador(random_rec, usuarios, k=top_k)
        res_pop = evaluar_recomendador(popularity_rec, usuarios, k=top_k)
        res_content = evaluar_recomendador(content_rec, usuarios, k=top_k)
        res_hw = evaluar_recomendador(hybrid_w_rec, usuarios, k=top_k)
        res_hc = evaluar_recomendador(hybrid_c_rec, usuarios, k=top_k)
        
        resultados_baselines = {
            "Random": res_random,
            "Popularidad": res_pop,
            "Content-Based": res_content,
            "Híbrido Ponderado": res_hw,
            "Híbrido Cascada": res_hc
        }
        
        # Encontrar el mejor modelo (para hacer tests estadísticos contra él)
        pesos = {"hitRate": 0.20, "precision": 0.15, "recall": 0.15, "f1": 0.15, "ndcg": 0.15, "mrr": 0.10, "map": 0.10}
        
        scores = []
        for name, res in resultados_baselines.items():
            score = (
                (res["hitRate"] / 100) * pesos["hitRate"] +
                (res["precision"] / 100) * pesos["precision"] +
                (res["recall"] / 100) * pesos["recall"] +
                (res["f1"] / 100) * pesos["f1"] +
                (res["ndcg"] / 100) * pesos["ndcg"] +
                (res["mrr"]) * pesos["mrr"] +
                (res["map"]) * pesos["map"]
            ) * 100
            scores.append({"nombre": name, "score": score, "res": res})
            
        scores.sort(key=lambda x: x["score"], reverse=True)
        mejor_modelo = scores[0]
        
        otros_modelos = {s["nombre"]: s["res"] for s in scores[1:]}
        
        tests_por_metrica = {}
        metricas_tests = ["hitRate", "precision", "recall", "ndcg"]
        for metrica in metricas_tests:
            tests_por_metrica[metrica] = comparar_con_baselines(mejor_modelo["res"], otros_modelos, metrica)
            
        st.session_state.resultados = {
            "stats": stats_dataset,
            "resultados_baselines": resultados_baselines,
            "mejor_modelo": mejor_modelo,
            "tests_por_metrica": tests_por_metrica,
            "scores": scores
        }
        
        # --- AUTO-SAVE PARA COMUNICACIÓN CON REACT ---
        react_data = {
            "ganador": {
                "nombre": mejor_modelo["nombre"],
                "score": mejor_modelo["score"]
            },
            "ordenados": []
        }
        for s in scores:
            react_data["ordenados"].append({
                "nombre": s["nombre"],
                "score": s["score"],
                "hitRate": s["res"]["hitRate"],
                "precision": s["res"]["precision"],
                "recall": s["res"]["recall"],
                "f1": s["res"]["f1"],
                "ndcg": s["res"]["ndcg"],
                "mrr": s["res"]["mrr"],
                "map": s["res"]["map"],
                "coverage": s["res"]["coverage"]
            })
            
        # Escribir en la carpeta public de React
        public_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
        os.makedirs(public_dir, exist_ok=True)
        try:
            with open(os.path.join(public_dir, 'resultados_streamlit.json'), 'w', encoding='utf-8') as f:
                json.dump(react_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            st.warning(f"No se pudo autoguardar el JSON para React: {e}")

# --- Visualización ---
if st.session_state.resultados:
    res = st.session_state.resultados
    stats = res["stats"]
    baselines = res["resultados_baselines"]
    mejor = res["mejor_modelo"]
    tests = res["tests_por_metrica"]
    scores = res["scores"]
    
    st.success(f"Evaluación completada para {stats['totalUsuarios']} usuarios sintéticos.")
    
    # 1. Dataset
    with st.expander("📊 Estadísticas del Dataset Sintético", expanded=True):
        col1, col2, col3 = st.columns(3)
        col1.metric("Usuarios Generados", stats["totalUsuarios"])
        col2.metric("Total de Compras", stats["totalCompras"])
        col3.metric("Promedio Compras/Usuario", stats["promedioCompras"])
        
        st.markdown("**Distribución de Categorías:**")
        df_cats = pd.DataFrame(list(stats["comprasPorCategoria"].items()), columns=["Categoría", "Compras"])
        st.bar_chart(df_cats.set_index("Categoría"))
        
        st.info(f"""
        **Interpretación del Dataset (Muestra de {stats['totalUsuarios']} usuarios):**
        - El volumen total de datos consiste en **{stats['totalCompras']} transacciones**, con una frecuencia de compra media de **{stats['promedioCompras']}** ítems por usuario.
        - **Distribución Comercial:** Como se aprecia en la gráfica, la simulación respeta los patrones de e-commerce donde algunas categorías dominan ampliamente el consumo. 
        - **Impacto del Cold-Start:** Al tener un promedio de {stats['promedioCompras']} compras por usuario, el sistema cuenta con un contexto mínimo suficiente para deducir patrones y ejecutar los tests, pero aún representa un escenario realista donde la escasez de datos (sparsity) pone a prueba el poder de predicción de los modelos.
        """)
        
    # --- Explicación de los Modelos y Métricas ---
    with st.expander("📖 Glosario: ¿Qué significan los Modelos y las Métricas?", expanded=False):
        st.markdown("""
        **📚 Los Algoritmos (Modelos):**
        - **Random:** Recomienda de forma completamente aleatoria. Sirve como base mínima. Si la IA no supera esto, no sirve.
        - **Popularidad:** Sugiere los productos más vendidos. Excelente para asegurar ventas seguras (Hit Rate), pero pobre en personalización.
        - **Content-Based:** Mide similitud de categorías (Coseno). Es el mejor para nichos porque asume que si compraste "X", te gustará algo muy similar.
        - **Híbrido Ponderado:** Combina puntuación de Popularidad y Content-Based, equilibrando lo que te gusta con lo que más se vende.
        - **Híbrido Cascada:** Primero filtra rígidamente por tus categorías favoritas y, sobre esa lista, ordena por los más populares.
        
        **📏 Las Métricas:**
        - **Hit Rate@K:** ¿A cuántos usuarios se les recomendó *al menos un* producto que realmente iban a comprar? (Mide atracción).
        - **Precision@K:** De los K productos recomendados, ¿cuántos fueron aciertos? (Mide exactitud de la lista).
        - **Recall@K:** De todos los productos que el usuario quería, ¿cuántos logró capturar el sistema? (Mide retención/descubrimiento).
        - **F1@K:** Promedio armónico entre Precision y Recall. Es el balance general de aciertos.
        - **NDCG@K:** No solo importa si acertaste, sino *dónde*. NDCG da más puntos si el producto correcto está en la posición 1 que en la 10.
        - **MRR (Mean Reciprocal Rank):** Mide cuán alto en la lista apareció el *primer* acierto. Un MRR de 0.5 indica que en promedio el primer acierto estuvo en la posición 2.
        - **Diversity / Novelty:** Miden si el algoritmo recomienda categorías variadas o si se estanca recomendando siempre lo mismo.
        """)

    # 2. Tabla de Métricas
    st.subheader("📈 Comparativa de Métricas por Modelo")
    
    metricas_visibles = [
        {"key": "hitRate", "label": "Hit Rate@K", "sufijo": "%"},
        {"key": "precision", "label": "Precision@K", "sufijo": "%"},
        {"key": "recall", "label": "Recall@K", "sufijo": "%"},
        {"key": "f1", "label": "F1@K", "sufijo": "%"},
        {"key": "mrr", "label": "MRR", "sufijo": ""},
        {"key": "map", "label": "MAP", "sufijo": ""},
        {"key": "ndcg", "label": "NDCG@K", "sufijo": "%"},
        {"key": "coverage", "label": "Coverage", "sufijo": "%"},
        {"key": "diversity", "label": "Diversity", "sufijo": "%"},
        {"key": "novelty", "label": "Novelty", "sufijo": "%"}
    ]
    
    # Preparar DataFrame
    tabla_data = []
    for m in metricas_visibles:
        row = {"Métrica": m["label"]}
        for nombre, resultado in baselines.items():
            row[nombre] = round(resultado.get(m["key"], 0), 4)
        tabla_data.append(row)
        
    df_metricas = pd.DataFrame(tabla_data).set_index("Métrica")
    st.dataframe(df_metricas.style.highlight_max(axis=1, color="lightgreen"), use_container_width=True)
    
    peor_hit = min(scores, key=lambda x: x["res"]["hitRate"])
    st.info(f"""
    **Análisis Adaptativo de Métricas:**
    - **Hit Rate y Precision:** El modelo **'{mejor['nombre']}'** destaca globalmente, logrando un Hit Rate de **{mejor['res']['hitRate']:.2f}%**. Por el contrario, el modelo **'{peor_hit['nombre']}'** obtuvo el peor Hit Rate ({peor_hit['res']['hitRate']:.2f}%), demostrando su deficiencia para atraer la atención primaria del cliente.
    - **NDCG@K (Calidad del Ranking):** El ganador obtuvo un NDCG de **{mejor['res']['ndcg']:.2f}%**. Un NDCG alto significa que cuando este algoritmo acierta, coloca los productos de interés en los *primeros lugares* (lo cual es vital para tiendas online).
    - **Diversity & Novelty:** Mientras modelos como 'Popularidad' tienden a mostrar productos repetitivos o "mainstream", algoritmos como 'Random' o 'Content-Based' pueden potenciar mejor la diversidad (Variety) del catálogo ({round(peor_hit['res'].get('diversity', 0), 2)}% vs {round(mejor['res'].get('diversity', 0), 2)}% del ganador).
    """)

    # 3. Gráficos Plotly
    st.subheader("📊 Visualizaciones")
    colA, colB = st.columns(2)
    
    COLORES_GRAFICOS = ['#EF4444', '#F59E0B', '#10B981', '#EC4899', '#14B8A6', '#8B5CF6']
    
    with colA:
        df_melted = df_metricas.reset_index().melt(id_vars=["Métrica"], var_name="Modelo", value_name="Valor")
        fig_bar = px.bar(df_melted, x="Métrica", y="Valor", color="Modelo", barmode="group", title="Comparación de Métricas", color_discrete_sequence=COLORES_GRAFICOS)
        st.plotly_chart(fig_bar, use_container_width=True)
        
    with colB:
        radar_keys = ['hitRate', 'precision', 'recall', 'f1', 'ndcg', 'diversity']
        fig_radar = go.Figure()
        
        for i, (nombre, resultado) in enumerate(baselines.items()):
            valores = [resultado.get(k, 0) for k in radar_keys]
            valores.append(valores[0]) 
            keys_plot = radar_keys + [radar_keys[0]]
            
            fig_radar.add_trace(go.Scatterpolar(
                r=valores,
                theta=keys_plot,
                fill='toself',
                name=nombre,
                line_color=COLORES_GRAFICOS[i % len(COLORES_GRAFICOS)]
            ))
            
        fig_radar.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
            showlegend=True,
            title="Perfil de Rendimiento (Radar)"
        )
        st.plotly_chart(fig_radar, use_container_width=True)

    # Lógica adaptativa para el texto del gráfico de barras
    mejor_metrica_llave = max(
        ['hitRate', 'precision', 'recall', 'ndcg', 'diversity'],
        key=lambda k: mejor['res'].get(k, 0)
    )
    nombres_metricas = {'hitRate': 'Hit Rate', 'precision': 'Precision', 'recall': 'Recall', 'ndcg': 'NDCG', 'diversity': 'Diversity'}
    nombre_metrica_destacada = nombres_metricas[mejor_metrica_llave]
    ventaja = mejor['res'].get(mejor_metrica_llave, 0) - peor_hit['res'].get(mejor_metrica_llave, 0)

    st.info(f"""
    **Interpretación Gráfica (Perfil de Rendimiento):**
    - En el **Gráfico de Radar**, puedes observar visualmente cómo el modelo **'{mejor['nombre']}'** cubre una mayor área global en comparación con **'{peor_hit['nombre']}'**.
    - Un polígono amplio y equilibrado como el de **'{mejor['nombre']}'** demuestra que no solo está siendo exacto, sino que también es capaz de retener volumen y mantener una diversidad aceptable. Los modelos híbridos suelen lograr polígonos más uniformes al combinar exactitud y popularidad.
    - **El Gráfico de Barras** confirma que, por ejemplo en la métrica **{nombre_metrica_destacada}**, el modelo '{mejor['nombre']}' logra una impresionante ventaja de **+{ventaja:.1f}%** sobre el modelo de menor rendimiento, justificando contundentemente por qué este algoritmo es superior globalmente.
    """)

    # 4. Tests Estadísticos
    st.subheader(f"🔬 Tests Estadísticos (Base: {mejor['nombre']})")
    st.markdown(f"Se compara el modelo ganador **{mejor['nombre']}** contra los demás algoritmos para determinar si la diferencia es estadísticamente significativa (p < 0.05).")
    
    tabs = st.tabs(["Hit Rate", "Precision", "Recall", "NDCG"])
    map_tabs = {"Hit Rate": "hitRate", "Precision": "precision", "Recall": "recall", "NDCG": "ndcg"}
    
    for i, (tab_name, metric_key) in enumerate(map_tabs.items()):
        with tabs[i]:
            test_data = tests[metric_key]
            test_rows = []
            for bl_name, t in test_data.items():
                is_sig = t["ttest"]["significant"] or t["wilcoxon"]["significant"]
                
                # Texto dinámico adaptativo para Cohen's D
                abs_d = abs(t["cohensD"])
                if abs_d >= 0.8:
                    d_mag = "Grande"
                elif abs_d >= 0.5:
                    d_mag = "Medio"
                elif abs_d >= 0.2:
                    d_mag = "Pequeño"
                else:
                    d_mag = "Despreciable"
                
                inter_texto = f"La ventaja de {mejor['nombre']} frente a {bl_name} es {'REAL' if is_sig else 'AZAROSA'} (Efecto: {d_mag})"
                
                test_rows.append({
                    "Modelo Comparado": bl_name,
                    "T-Statistic": round(t["ttest"]["tStatistic"], 4),
                    "p-value (T-Test)": round(t["ttest"]["pValue"], 4),
                    "p-value (Wilcoxon)": round(t["wilcoxon"]["pValue"], 4),
                    "Cohen's d": round(t["cohensD"], 4),
                    "Interpretación Clínica": inter_texto,
                    "Significativo (p < 0.05)": "✅ Sí" if is_sig else "❌ No"
                })
            st.dataframe(pd.DataFrame(test_rows), use_container_width=True)

    st.info(f"""
    **Análisis de la Significancia Estadística:**
    - **T-Statistic (Magnitud de Tensión):** Este valor representa matemáticamente la diferencia entre el ganador y el perdedor. Un número positivo alto significa que **'{mejor['nombre']}'** supera claramente al contrincante tomando en cuenta la desviación estándar de los resultados.
    - **P-Value (✅ / ❌):** Se aplicaron dos pruebas rigurosas (T-Test y Wilcoxon). Donde ves un **✅ Sí**, está comprobado con >95% de confianza que la superioridad de **'{mejor['nombre']}'** es real, y no un "golpe de suerte" de la simulación.
    - **D de Cohen (Efecto en la Vida Real):** Mientras los p-values dicen "existe diferencia", la D de Cohen indica "qué tan grande se sentirá". Un efecto 'Grande' (d > 0.8) implica que implementar **'{mejor['nombre']}'** incrementará drásticamente la conversión en ventas.
    """)

    # 5. Veredicto Final
    st.markdown("---")
    st.success(f"🏆 **MEJOR MODELO: {mejor['nombre']}** con un score global de **{round(mejor['score'], 2)} / 100**.")
    
    # 6. Exportación
    st.subheader("📥 Exportar Resultados")
    
    col_pdf, col_excel, col_json = st.columns(3)
    
    # EXCEL
    output_excel = io.BytesIO()
    with pd.ExcelWriter(output_excel, engine='xlsxwriter') as writer:
        workbook = writer.book
        
        # Formatos Avanzados
        header_format = workbook.add_format({
            'bold': True,
            'text_wrap': True,
            'valign': 'center',
            'align': 'center',
            'fg_color': '#4F46E5',
            'font_color': 'white',
            'border': 1
        })
        cell_format = workbook.add_format({'border': 1, 'align': 'center'})
        percent_format = workbook.add_format({'border': 1, 'align': 'center', 'num_format': '0.00%'})
        number_format = workbook.add_format({'border': 1, 'align': 'center', 'num_format': '0.0000'})
        title_format = workbook.add_format({
            'bold': True, 'font_size': 16, 'font_color': '#166534', 
            'align': 'center', 'valign': 'center', 'fg_color': '#DCFCE7', 'border': 1
        })
        subtitle_format = workbook.add_format({'bold': True, 'font_size': 12, 'font_color': '#374151'})
        text_format = workbook.add_format({'text_wrap': True, 'valign': 'top'})

        # 1. Pestaña "Resumen Ejecutivo"
        ws_resumen = workbook.add_worksheet("Resumen Ejecutivo")
        
        # Escribir Veredicto
        ws_resumen.merge_range('B2:J4', f"🏆 MEJOR MODELO: {mejor['nombre']} (Score: {round(mejor['score'], 2)} / 100)", title_format)
        
        ws_resumen.write('B6', "Interpretación de los Resultados y Gráficas:", subtitle_format)
        
        # Textos Adaptativos
        txt_radar = f"En el Gráfico de Radar (derecha), se observa cómo '{mejor['nombre']}' ocupa una mayor área o mantiene un polígono equilibrado. Por ejemplo, logra un balance sólido entre Precision ({round(mejor['res']['precision'], 2)}%) y Recall ({round(mejor['res']['recall'], 2)}%), indicando exactitud sin sacrificar descubrimiento."
        txt_bar = f"El Gráfico de Barras (izquierda) demuestra de forma clara cómo el modelo ganador mantiene sus puntuaciones altas. Con un NDCG de {round(mejor['res']['ndcg'], 2)}% y F1 de {round(mejor['res']['f1'], 2)}%, supera masivamente a algoritmos primitivos en personalización."
        
        ws_resumen.merge_range('B8:E11', txt_bar, text_format)
        ws_resumen.merge_range('G8:J11', txt_radar, text_format)
        
        # Guardar e insertar Gráficos
        temp_bar_xl = "temp_bar_xl.png"
        temp_radar_xl = "temp_radar_xl.png"
        
        try:
            fig_bar.write_image(temp_bar_xl, width=500, height=350)
            fig_radar.write_image(temp_radar_xl, width=500, height=350)
            
            ws_resumen.insert_image('B13', temp_bar_xl)
            ws_resumen.insert_image('G13', temp_radar_xl)
        except Exception as e:
            ws_resumen.write('B13', f"No se pudieron cargar los gráficos: {e}")

        # Función Helper para exportar dataframes con estilos precisos celda por celda
        def write_styled_df(df, sheet_name, is_metric_table=False):
            ws = workbook.add_worksheet(sheet_name)
            
            # Escribir Headers
            for col_num, value in enumerate(df.columns.values):
                ws.write(0, col_num, str(value), header_format)
                
            # Escribir Filas
            for row_num in range(len(df)):
                row_data = df.iloc[row_num]
                is_mrr = False
                if is_metric_table and 'Métrica' in df.columns:
                    is_mrr = row_data['Métrica'] in ['MRR', 'MAP']
                
                for col_num in range(len(df.columns)):
                    val = row_data.iloc[col_num]
                    
                    if isinstance(val, (dict, list)):
                        val = str(val)
                        
                    if col_num == 0 or (not isinstance(val, (int, float))):
                        ws.write(row_num + 1, col_num, val if not pd.isna(val) else "", cell_format)
                    else:
                        if is_metric_table:
                            if is_mrr:
                                ws.write(row_num + 1, col_num, val, number_format)
                            else:
                                # Convertir a porcentaje real de Excel
                                ws.write(row_num + 1, col_num, val / 100.0, percent_format)
                        else:
                            # Para tests estadisticos y dataset
                            if sheet_name == "Dataset":
                                ws.write(row_num + 1, col_num, val, cell_format)
                            else:
                                ws.write(row_num + 1, col_num, val, number_format)
                            
            # Auto-ajustar ancho de columnas
            for col_num, value in enumerate(df.columns.values):
                col_len = max(df.iloc[:, col_num].astype(str).map(len).max(), len(str(value))) + 4
                ws.set_column(col_num, col_num, col_len)
        
        # 2. Pestaña Dataset
        write_styled_df(pd.DataFrame([stats]), "Dataset")
        
        # 3. Pestaña Métricas
        write_styled_df(df_metricas.reset_index(), "Metricas", is_metric_table=True)
        
        # 4. Pestaña Tests
        all_tests = []
        for m_key, t_data in tests.items():
            for b_name, t_vals in t_data.items():
                all_tests.append({
                    "Métrica": m_key,
                    "Modelo": b_name,
                    "T-Statistic": t_vals["ttest"]["tStatistic"],
                    "T-pVal": t_vals["ttest"]["pValue"],
                    "W-pVal": t_vals["wilcoxon"]["pValue"],
                    "Cohens D": t_vals["cohensD"]
                })
        write_styled_df(pd.DataFrame(all_tests), "Tests Estadisticos")
        
    excel_data = output_excel.getvalue()
    
    # Limpieza
    try:
        os.remove(temp_bar_xl)
        os.remove(temp_radar_xl)
    except:
        pass
    
    with col_excel:
        st.download_button(
            label="📊 Descargar Resultados en Excel",
            data=excel_data,
            file_name=f"evaluacion_ia_{datetime.datetime.now().strftime('%Y%m%d')}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True
        )
        
    # PDF
    class PDF(FPDF):
        def header(self):
            # Color corporativo Indigo: #4F46E5 -> 79, 70, 229
            self.set_fill_color(79, 70, 229)
            self.rect(0, 0, 210, 25, 'F')
            self.set_font('Helvetica', 'B', 18)
            self.set_text_color(255, 255, 255)
            self.set_y(8)
            self.cell(0, 10, 'TechStore AI - Reporte Avanzado', border=0, ln=1, align='C')
            self.ln(10)
            
        def footer(self):
            self.set_y(-15)
            self.set_fill_color(79, 70, 229)
            self.rect(10, 282, 190, 1, 'F')
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')
            
    pdf = PDF()
    pdf.add_page()
    
    # Metadatos y Veredicto
    pdf.set_font("Helvetica", size=10)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 6, txt=f"Fecha de evaluacion: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=1)
    pdf.cell(0, 6, txt=f"Usuarios Sinteticos: {stats['totalUsuarios']} | Total de Compras: {stats['totalCompras']}", ln=1)
    pdf.ln(5)
    
    # Caja de veredicto
    pdf.set_fill_color(240, 253, 244) # Verde clarito
    pdf.set_draw_color(74, 222, 128)
    pdf.set_line_width(0.5)
    pdf.rect(10, pdf.get_y(), 190, 15, 'DF')
    pdf.set_y(pdf.get_y() + 2)
    pdf.set_font("Helvetica", 'B', 12)
    pdf.set_text_color(22, 101, 52)
    pdf.cell(0, 10, txt=f" MEJOR MODELO: {mejor['nombre']} (Score: {round(mejor['score'], 2)}/100)", ln=1, align='C')
    pdf.ln(8)
    
    # Tabla de Métricas (Top 3)
    pdf.set_font("Helvetica", 'B', 14)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 10, txt="Tabla Comparativa de Métricas (Top 3)", ln=1)
    
    pdf.set_font("Helvetica", size=10)
    top_3 = scores[:3]
    with pdf.table(text_align="CENTER", col_widths=(40, 30, 30, 30, 30), borders_layout="ALL") as table:
        # Header
        header = table.row()
        for header_text in ["Modelo", "Hit Rate", "Precision", "NDCG", "Score Final"]:
            pdf.set_fill_color(79, 70, 229)
            pdf.set_text_color(255, 255, 255)
            header.cell(header_text)
        
        # Filas
        pdf.set_text_color(50, 50, 50)
        for i, s in enumerate(top_3):
            row = table.row()
            if i % 2 == 0:
                pdf.set_fill_color(245, 245, 250)
            else:
                pdf.set_fill_color(255, 255, 255)
                
            m = s["res"]
            row.cell(s['nombre'])
            row.cell(f"{round(m['hitRate'],2)}%")
            row.cell(f"{round(m['precision'],2)}%")
            row.cell(f"{round(m['ndcg'],2)}%")
            row.cell(f"{round(s['score'],2)}/100")
            
    pdf.ln(5)
    
    # Interpretación de la Tabla
    pdf.set_font("Helvetica", size=10)
    pdf.set_text_color(60, 60, 60)
    if len(top_3) > 1:
        diff_score = top_3[0]['score'] - top_3[1]['score']
        pdf.multi_cell(0, 5, txt=f"Análisis de Tabla: El modelo '{top_3[0]['nombre']}' lidera el podio con un score de {round(top_3[0]['score'], 2)}/100, superando al segundo lugar ('{top_3[1]['nombre']}') por {round(diff_score, 2)} puntos. Destaca su Hit Rate ({round(top_3[0]['res']['hitRate'], 2)}%) asegurando que atrae al cliente, mientras mantiene un NDCG de {round(top_3[0]['res']['ndcg'], 2)}%, garantizando que lo que el usuario quiere aparece en las primeras posiciones.")
    pdf.ln(10)
    
    # Guardar gráficos temporalmente y añadir
    pdf.set_font("Helvetica", 'B', 14)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 10, txt="Visualizaciones de Rendimiento", ln=1)
    
    temp_bar = "temp_bar.png"
    temp_radar = "temp_radar.png"
    
    try:
        # kaleido requerido para esto
        fig_bar.write_image(temp_bar, width=600, height=400)
        fig_radar.write_image(temp_radar, width=600, height=400)
        
        y_before = pdf.get_y()
        pdf.image(temp_bar, x=10, y=y_before, w=90)
        pdf.image(temp_radar, x=105, y=y_before, w=90)
        pdf.set_y(y_before + 65)
        
        # Add Interpretation after charts
        pdf.set_font("Helvetica", 'B', 12)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(0, 10, txt="Interpretación de los Resultados y Gráficas:", ln=1)
        
        pdf.set_font("Helvetica", size=10)
        pdf.set_text_color(60, 60, 60)
        pdf.multi_cell(0, 6, txt=f"Basado en las visualizaciones a color y el analisis de metricas, el modelo '{mejor['nombre']}' se consolida como la mejor opcion de despliegue debido a los siguientes hallazgos:")
        pdf.ln(2)
        
        # Viñeta 1
        pdf.set_font("Helvetica", 'B', 10)
        pdf.cell(5, 6, txt="-")
        pdf.set_font("Helvetica", size=10)
        pdf.multi_cell(0, 6, txt=f"En el Grafico de Radar (derecha), se observa como '{mejor['nombre']}' ocupa una mayor area o mantiene un poligono muy equilibrado. Por ejemplo, logra un balance sólido entre Precision ({round(mejor['res']['precision'], 2)}%) y Recall ({round(mejor['res']['recall'], 2)}%), a diferencia de modelos base que se deforman hacia una sola metrica. Esto indica exactitud sin sacrificar descubrimiento de catalogo.")
        pdf.ln(2)
        
        # Viñeta 2
        pdf.set_font("Helvetica", 'B', 10)
        pdf.cell(5, 6, txt="-")
        pdf.set_font("Helvetica", size=10)
        pdf.multi_cell(0, 6, txt=f"El Grafico de Barras (izquierda) demuestra de forma contundente la superioridad del ganador en metricas complejas de retencion. Con un NDCG de {round(mejor['res']['ndcg'], 2)}% y F1 de {round(mejor['res']['f1'], 2)}%, supera masivamente a algoritmos primitivos (como Random o Popularidad pura) en la tarea vital de personalizacion.")
        pdf.ln(5)
        
        # Clean up
        os.remove(temp_bar)
        os.remove(temp_radar)
    except Exception as e:
        pdf.set_font("Helvetica", 'I', 10)
        pdf.set_text_color(255, 0, 0)
        pdf.cell(0, 10, txt=f"Instala 'kaleido' para ver gráficos en PDF.", ln=1)

    pdf_bytes = bytes(pdf.output())
    
    with col_pdf:
        st.download_button(
            label="📄 Descargar Reporte Avanzado (PDF)",
            data=pdf_bytes,
            file_name=f"reporte_avanzado_{datetime.datetime.now().strftime('%Y%m%d')}.pdf",
            mime="application/pdf",
            use_container_width=True
        )

