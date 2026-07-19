import math
import numpy as np
import scipy.stats as stats
from data import PRODUCTOS

def calcular_metricas_usuario(recomendaciones_ids, test_ids, historial_train):
    k = len(recomendaciones_ids)
    test_set = set(test_ids)
    
    if not test_set:
        return {
            "hitRate": 0, "precision": 0, "recall": 0, "f1": 0,
            "mrr": 0, "ap": 0, "dcg": 0, "idcg": 0, "ndcg": 0,
            "novelty": 0, "aciertos": 0
        }
        
    relevancias = [1 if r_id in test_set else 0 for r_id in recomendaciones_ids]
    aciertos = sum(relevancias)
    
    hit_rate = 1 if aciertos > 0 else 0
    precision = aciertos / k if k > 0 else 0
    recall = aciertos / len(test_set)
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    mrr = 0
    for i, r_id in enumerate(recomendaciones_ids):
        if r_id in test_set:
            mrr = 1 / (i + 1)
            break
            
    ap = 0
    aciertos_acumulados = 0
    for i, r_id in enumerate(recomendaciones_ids):
        if r_id in test_set:
            aciertos_acumulados += 1
            ap += aciertos_acumulados / (i + 1)
            
    ap = ap / min(len(test_set), k) if aciertos > 0 else 0
    
    dcg = 0
    for i, rel in enumerate(relevancias):
        if rel == 1:
            dcg += 1 / math.log2(i + 2)
            
    ideal_relevancias = min(len(test_set), k)
    idcg = 0
    for i in range(ideal_relevancias):
        idcg += 1 / math.log2(i + 2)
        
    ndcg = dcg / idcg if idcg > 0 else 0
    
    novelty = 0
    if historial_train:
        frecuencia_categorias = {}
        for h in historial_train:
            prod = next((p for p in PRODUCTOS if p["id"] == h["productoId"]), None)
            if prod:
                frecuencia_categorias[prod["categoria"]] = frecuencia_categorias.get(prod["categoria"], 0) + 1
                
        if frecuencia_categorias:
            categoria_favorita = max(frecuencia_categorias.items(), key=lambda x: x[1])[0]
            novedosos = 0
            for r_id in recomendaciones_ids:
                prod = next((p for p in PRODUCTOS if p["id"] == r_id), None)
                if prod and prod["categoria"] != categoria_favorita:
                    novedosos += 1
            novelty = novedosos / k if k > 0 else 0
            
    return {
        "hitRate": hit_rate,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "mrr": mrr,
        "ap": ap,
        "dcg": dcg,
        "idcg": idcg,
        "ndcg": ndcg,
        "novelty": novelty,
        "aciertos": aciertos
    }

def agregar_metricas(resultados_por_usuario):
    if not resultados_por_usuario:
        return {
            "hitRate": 0, "precision": 0, "recall": 0, "f1": 0,
            "mrr": 0, "map": 0, "ndcg": 0, "coverage": 0,
            "diversity": 0, "novelty": 0, "aciertosPromedio": 0,
            "totalUsuarios": 0
        }
        
    metricas_individuales = [
        calcular_metricas_usuario(r["recomendacionesIds"], r["testIds"], r["historialTrain"])
        for r in resultados_por_usuario
    ]
    
    def promediar(key):
        return sum(m[key] for m in metricas_individuales) / len(metricas_individuales)
        
    todos_recomendados = set()
    for r in resultados_por_usuario:
        todos_recomendados.update(r["recomendacionesIds"])
    coverage = (len(todos_recomendados) / len(PRODUCTOS)) * 100
    
    diversidades = []
    for r in resultados_por_usuario:
        recs = r["recomendacionesIds"]
        if len(recs) < 2:
            diversidades.append(0)
            continue
        pares = 0
        similitud = 0
        for i in range(len(recs)):
            for j in range(i + 1, len(recs)):
                p1 = next((p for p in PRODUCTOS if p["id"] == recs[i]), None)
                p2 = next((p for p in PRODUCTOS if p["id"] == recs[j]), None)
                if p1 and p2:
                    pares += 1
                    if p1["categoria"] == p2["categoria"]:
                        similitud += 1
        diversidades.append((1 - similitud / pares) * 100 if pares > 0 else 0)
        
    diversity = sum(diversidades) / len(diversidades) if diversidades else 0
    
    return {
        "hitRate": promediar("hitRate") * 100,
        "precision": promediar("precision") * 100,
        "recall": promediar("recall") * 100,
        "f1": promediar("f1") * 100,
        "mrr": promediar("mrr"),
        "map": promediar("ap"),
        "ndcg": promediar("ndcg") * 100,
        "coverage": coverage,
        "diversity": diversity,
        "novelty": promediar("novelty") * 100,
        "aciertosPromedio": promediar("aciertos"),
        "totalUsuarios": len(resultados_por_usuario),
        "metricasIndividuales": metricas_individuales
    }

def evaluar_recomendador(recomendador, usuarios, k=10, ratio_train=0.8):
    from data import dividir_train_test_por_usuario
    resultados_por_usuario = []
    
    for usuario in usuarios:
        splits = dividir_train_test_por_usuario(usuario, ratio_train)
        train = splits["train"]
        test = splits["test"]
        
        if not train or not test:
            continue
            
        test_ids = [c["productoId"] for c in test]
        recomendaciones = recomendador.recomendar(train, n=k)
        recomendaciones_ids = [p["id"] for p in recomendaciones]
        
        resultados_por_usuario.append({
            "usuarioId": usuario["userId"],
            "recomendacionesIds": recomendaciones_ids,
            "testIds": test_ids,
            "historialTrain": train
        })
        
    return agregar_metricas(resultados_por_usuario)

def interpretar_cohens_d(d):
    abs_d = abs(d)
    if abs_d < 0.2: return "Efecto insignificante"
    if abs_d < 0.5: return "Efecto pequeño"
    if abs_d < 0.8: return "Efecto mediano"
    return "Efecto grande"

def comparar_con_baselines(resultados_modelo, resultados_baselines, metrica):
    metricas_modelo = [m[metrica] for m in resultados_modelo.get("metricasIndividuales", [])]
    comparaciones = {}
    
    for nombre, res_baseline in resultados_baselines.items():
        metricas_baseline = [m[metrica] for m in res_baseline.get("metricasIndividuales", [])]
        
        if not metricas_modelo or not metricas_baseline or len(metricas_modelo) != len(metricas_baseline):
            comparaciones[nombre] = {
                "ttest": {"tStatistic": 0, "pValue": 1, "significant": False},
                "wilcoxon": {"zStatistic": 0, "pValue": 1, "significant": False},
                "cohensD": 0,
                "interpretacion": "Error/Sin datos"
            }
            continue
            
        diferencias = np.array(metricas_modelo) - np.array(metricas_baseline)
        mean_diff = np.mean(diferencias)
        std_diff = np.std(diferencias, ddof=1) if len(diferencias) > 1 else 0
        
        # T-Test Pareado
        t_stat, t_p = stats.ttest_rel(metricas_modelo, metricas_baseline)
        if math.isnan(t_stat): t_stat = 0
        if math.isnan(t_p): t_p = 1
        
        # Wilcoxon
        try:
            # wilcoxon can raise error if all differences are zero
            w_stat, w_p = stats.wilcoxon(metricas_modelo, metricas_baseline)
        except ValueError:
            w_stat, w_p = 0, 1
            
        if math.isnan(w_stat): w_stat = 0
        if math.isnan(w_p): w_p = 1
        
        # Cohen's D
        cohens_d = mean_diff / std_diff if std_diff != 0 else 0
        
        comparaciones[nombre] = {
            "ttest": {
                "tStatistic": float(t_stat),
                "pValue": float(t_p),
                "significant": t_p < 0.05
            },
            "wilcoxon": {
                "zStatistic": float(w_stat),
                "pValue": float(w_p),
                "significant": w_p < 0.05
            },
            "cohensD": float(cohens_d),
            "interpretacion": interpretar_cohens_d(cohens_d)
        }
        
    return comparaciones

def intervalos_confianza_por_metrica(resultado, iteraciones=1000):
    metricas_individuales = resultado.get("metricasIndividuales", [])
    if not metricas_individuales:
        return {}
        
    keys = ["hitRate", "precision", "recall", "f1", "mrr", "ap", "ndcg", "novelty"]
    intervalos = {}
    
    n = len(metricas_individuales)
    for key in keys:
        valores = [m[key] for m in metricas_individuales]
        if not valores:
            continue
            
        # Bootstrap
        medias_bootstrap = []
        for _ in range(iteraciones):
            muestra = np.random.choice(valores, size=n, replace=True)
            medias_bootstrap.append(np.mean(muestra))
            
        medias_bootstrap.sort()
        alpha = 0.05
        lower_idx = int((alpha / 2) * iteraciones)
        upper_idx = int((1 - alpha / 2) * iteraciones)
        
        intervalos[key] = {
            "media": float(np.mean(valores)),
            "lower": float(medias_bootstrap[lower_idx]),
            "upper": float(medias_bootstrap[upper_idx])
        }
        
    return intervalos
