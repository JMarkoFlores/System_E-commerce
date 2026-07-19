import random
import datetime

PRODUCTOS = [
  {"id": 1, "nombre": 'Laptop Gaming ROG', "categoria": 'Electrónica', "precio": 1500, "tags": ['gaming','laptop']},
  {"id": 2, "nombre": 'MacBook Pro', "categoria": 'Electrónica', "precio": 2200, "tags": ['apple','laptop']},
  {"id": 3, "nombre": 'Laptop Dell XPS', "categoria": 'Electrónica', "precio": 1800, "tags": ['dell','laptop']},
  {"id": 4, "nombre": 'PC Gaming RGB', "categoria": 'Electrónica', "precio": 2000, "tags": ['gaming','pc']},
  {"id": 5, "nombre": 'Monitor 27 4K', "categoria": 'Electrónica', "precio": 600, "tags": ['monitor','4k']},
  {"id": 6, "nombre": 'Smartphone iPhone 15', "categoria": 'Electrónica', "precio": 1200, "tags": ['iphone','smartphone']},
  {"id": 7, "nombre": 'Samsung Galaxy S24', "categoria": 'Electrónica', "precio": 1100, "tags": ['samsung','smartphone']},
  {"id": 8, "nombre": 'Tablet iPad Pro', "categoria": 'Electrónica', "precio": 1300, "tags": ['tablet','apple']},
  {"id": 9, "nombre": 'Tablet Samsung Tab', "categoria": 'Electrónica', "precio": 900, "tags": ['tablet','samsung']},
  {"id": 10, "nombre": 'Smartwatch Apple Watch', "categoria": 'Electrónica', "precio": 500, "tags": ['watch','apple']},
  
  {"id": 11, "nombre": 'Mouse Gaming Razer', "categoria": 'Periféricos', "precio": 80, "tags": ['mouse','gaming']},
  {"id": 12, "nombre": 'Teclado Mecánico RGB', "categoria": 'Periféricos', "precio": 120, "tags": ['keyboard','gaming']},
  {"id": 14, "nombre": 'Teclado Logitech', "categoria": 'Periféricos', "precio": 90, "tags": ['keyboard','logitech']},
  {"id": 15, "nombre": 'Webcam Full HD', "categoria": 'Periféricos', "precio": 70, "tags": ['webcam']},
  {"id": 16, "nombre": 'Mousepad XL', "categoria": 'Periféricos', "precio": 40, "tags": ['mousepad']},
  {"id": 17, "nombre": 'Control Xbox', "categoria": 'Periféricos', "precio": 65, "tags": ['gamepad']},
  {"id": 18, "nombre": 'Control PlayStation', "categoria": 'Periféricos', "precio": 70, "tags": ['gamepad']},
  {"id": 19, "nombre": 'Lector de Tarjetas', "categoria": 'Periféricos', "precio": 30, "tags": ['usb']},
  {"id": 20, "nombre": 'Hub USB-C', "categoria": 'Periféricos', "precio": 55, "tags": ['usb','hub']},
  
  {"id": 21, "nombre": 'Auriculares Sony XM5', "categoria": 'Audio', "precio": 350, "tags": ['headphones']},
  {"id": 22, "nombre": 'Auriculares Bose', "categoria": 'Audio', "precio": 330, "tags": ['headphones']},
  {"id": 23, "nombre": 'Micrófono Blue Yeti', "categoria": 'Audio', "precio": 150, "tags": ['microphone']},
  {"id": 24, "nombre": 'Micrófono Rode', "categoria": 'Audio', "precio": 180, "tags": ['microphone']},
  {"id": 25, "nombre": 'Altavoz Bluetooth JBL', "categoria": 'Audio', "precio": 120, "tags": ['speaker']},
  {"id": 26, "nombre": 'Altavoz Bose', "categoria": 'Audio', "precio": 200, "tags": ['speaker']},
  {"id": 27, "nombre": 'Barra de Sonido', "categoria": 'Audio', "precio": 300, "tags": ['soundbar']},
  {"id": 28, "nombre": 'Audífonos In-Ear', "categoria": 'Audio', "precio": 60, "tags": ['earbuds']},
  {"id": 29, "nombre": 'Audífonos Gaming', "categoria": 'Audio', "precio": 110, "tags": ['gaming']},
  {"id": 30, "nombre": 'Interfaz de Audio', "categoria": 'Audio', "precio": 250, "tags": ['audio','studio']},
  
  {"id": 31, "nombre": 'SSD NVMe 1TB', "categoria": 'Almacenamiento', "precio": 120, "tags": ['ssd']},
  {"id": 32, "nombre": 'SSD 512GB', "categoria": 'Almacenamiento', "precio": 80, "tags": ['ssd']},
  {"id": 33, "nombre": 'HDD 4TB', "categoria": 'Almacenamiento', "precio": 100, "tags": ['hdd']},
  {"id": 34, "nombre": 'HDD 2TB', "categoria": 'Almacenamiento', "precio": 70, "tags": ['hdd']},
  {"id": 35, "nombre": 'USB 64GB', "categoria": 'Almacenamiento', "precio": 20, "tags": ['usb']},
  {"id": 36, "nombre": 'USB 128GB', "categoria": 'Almacenamiento', "precio": 35, "tags": ['usb']},
  {"id": 37, "nombre": 'MicroSD 256GB', "categoria": 'Almacenamiento', "precio": 45, "tags": ['sd']},
  {"id": 38, "nombre": 'MicroSD 512GB', "categoria": 'Almacenamiento', "precio": 80, "tags": ['sd']},
  {"id": 39, "nombre": 'NAS 4 Bahías', "categoria": 'Almacenamiento', "precio": 600, "tags": ['nas']},
  {"id": 40, "nombre": 'Disco Externo SSD', "categoria": 'Almacenamiento', "precio": 150, "tags": ['ssd']},
  
  {"id": 41, "nombre": 'Silla Gaming', "categoria": 'Muebles', "precio": 400, "tags": ['chair','gaming']},
  {"id": 42, "nombre": 'Silla Ergonómica', "categoria": 'Muebles', "precio": 450, "tags": ['chair']},
  {"id": 43, "nombre": 'Escritorio Gamer', "categoria": 'Muebles', "precio": 350, "tags": ['desk']},
  {"id": 44, "nombre": 'Escritorio Regulable', "categoria": 'Muebles', "precio": 500, "tags": ['desk']},
  {"id": 45, "nombre": 'Soporte Laptop', "categoria": 'Muebles', "precio": 50, "tags": ['stand']},
  {"id": 46, "nombre": 'Repisa Oficina', "categoria": 'Muebles', "precio": 90, "tags": ['shelf']},
  {"id": 47, "nombre": 'Mesa Auxiliar', "categoria": 'Muebles', "precio": 70, "tags": ['table']},
  {"id": 48, "nombre": 'Cajonera', "categoria": 'Muebles', "precio": 110, "tags": ['drawer']},
  {"id": 49, "nombre": 'Lámpara de Pie', "categoria": 'Muebles', "precio": 85, "tags": ['lamp']},
  {"id": 50, "nombre": 'Lámpara Escritorio', "categoria": 'Muebles', "precio": 45, "tags": ['lamp']},
  
  {"id": 51, "nombre": 'Tira LED RGB', "categoria": 'Iluminación', "precio": 30, "tags": ['led','rgb']},
  {"id": 52, "nombre": 'Panel LED', "categoria": 'Iluminación', "precio": 60, "tags": ['led']},
  {"id": 53, "nombre": 'Luz Ambiente', "categoria": 'Iluminación', "precio": 40, "tags": ['ambient']},
  {"id": 54, "nombre": 'Aro de Luz', "categoria": 'Iluminación', "precio": 70, "tags": ['ring+light']},
  {"id": 55, "nombre": 'Foco Inteligente', "categoria": 'Iluminación', "precio": 35, "tags": ['smart+bulb']},
  {"id": 56, "nombre": 'Lámpara RGB Gaming', "categoria": 'Iluminación', "precio": 55, "tags": ['rgb']},
  {"id": 57, "nombre": 'Iluminación Monitor', "categoria": 'Iluminación', "precio": 65, "tags": ['monitor+light']},
  {"id": 58, "nombre": 'Luz Fotográfica', "categoria": 'Iluminación', "precio": 120, "tags": ['photo+light']},
  {"id": 59, "nombre": 'LED Smart Strip', "categoria": 'Iluminación', "precio": 50, "tags": ['smart+led']},
  {"id": 60, "nombre": 'Luz Nocturna', "categoria": 'Iluminación', "precio": 25, "tags": ['night+light']},
  
  {"id": 61, "nombre": 'Cámara Canon R6', "categoria": 'Fotografía', "precio": 2500, "tags": ['camera']},
  {"id": 62, "nombre": 'Cámara Sony A7', "categoria": 'Fotografía', "precio": 2300, "tags": ['camera']},
  {"id": 63, "nombre": 'Trípode', "categoria": 'Fotografía', "precio": 90, "tags": ['tripod']},
  {"id": 64, "nombre": 'Elgato Stream Deck', "categoria": 'Streaming', "precio": 150, "tags": ['streaming']},
  {"id": 65, "nombre": 'Capturadora Video', "categoria": 'Streaming', "precio": 180, "tags": ['capture']},
  {"id": 66, "nombre": 'Green Screen', "categoria": 'Streaming', "precio": 130, "tags": ['green+screen']},
  {"id": 67, "nombre": 'Webcam Streaming', "categoria": 'Streaming', "precio": 140, "tags": ['webcam']},
  {"id": 68, "nombre": 'Luz Streaming', "categoria": 'Streaming', "precio": 75, "tags": ['light']},
  {"id": 69, "nombre": 'Micrófono Streaming', "categoria": 'Streaming', "precio": 160, "tags": ['microphone']},
  {"id": 70, "nombre": 'Soporte Micrófono', "categoria": 'Streaming', "precio": 55, "tags": ['arm']},
  
  {"id": 71, "nombre": "Soporte Micrófono Profesional", "categoria": "Streaming", "precio": 55, "tags": ["microfono","arm","stream"]},
  {"id": 72, "nombre": "Webcam Full HD", "categoria": "Streaming", "precio": 120, "tags": ["webcam","video","stream"]},
  {"id": 73, "nombre": "Ring Light 18 pulgadas", "categoria": "Streaming", "precio": 95, "tags": ["iluminacion","video","stream"]},
  {"id": 74, "nombre": "Capturadora HDMI USB", "categoria": "Streaming", "precio": 160, "tags": ["capture","video","stream"]},
  {"id": 75, "nombre": "Trípode Profesional", "categoria": "Streaming", "precio": 80, "tags": ["camera","soporte","video"]},
  {"id": 76, "nombre": "Cámara Web 4K", "categoria": "Streaming", "precio": 320, "tags": ["4k","webcam","stream"]},
  {"id": 77, "nombre": "Iluminación LED Panel", "categoria": "Streaming", "precio": 150, "tags": ["light","studio","video"]},
  {"id": 78, "nombre": "Brazo Articulado Doble", "categoria": "Streaming", "precio": 90, "tags": ["arm","microfono","desk"]},
  {"id": 79, "nombre": "Mixer de Audio Streaming", "categoria": "Streaming", "precio": 280, "tags": ["mixer","audio","stream"]},
  {"id": 80, "nombre": "Fondo Verde Chroma Key Streaming", "categoria": "Streaming", "precio": 110, "tags": ["chroma","video","studio"]},
  
  {"id": 81, "nombre": "Monitor Gamer 27\" 144Hz", "categoria": "Electrónica", "precio": 480, "tags": ["monitor","gaming","144hz"]},
  {"id": 82, "nombre": "Monitor UltraWide 34\"", "categoria": "Electrónica", "precio": 720, "tags": ["ultrawide","productividad","display"]},
  {"id": 83, "nombre": "Monitor 4K IPS 32\"", "categoria": "Electrónica", "precio": 850, "tags": ["4k","ips","diseno"]},
  {"id": 84, "nombre": "Monitor Portátil USB-C", "categoria": "Electrónica", "precio": 330, "tags": ["portable","usb-c","display"]},
  {"id": 85, "nombre": "Monitor Curvo 165Hz", "categoria": "Electrónica", "precio": 690, "tags": ["curvo","gaming","165hz"]},
  
  {"id": 86, "nombre": "Audífonos Gaming Surround", "categoria": "Audio", "precio": 140, "tags": ["gaming","surround","headset"]},
  {"id": 87, "nombre": "Audífonos Bluetooth ANC", "categoria": "Audio", "precio": 220, "tags": ["bluetooth","noise-cancel","wireless"]},
  {"id": 88, "nombre": "Micrófono Condensador USB", "categoria": "Audio", "precio": 180, "tags": ["microfono","studio","usb"]},
  {"id": 89, "nombre": "Barra de Sonido 2.1", "categoria": "Audio", "precio": 260, "tags": ["soundbar","home","audio"]},
  {"id": 90, "nombre": "Interfaz de Audio USB", "categoria": "Audio", "precio": 310, "tags": ["audio","interface","recording"]},
  
  {"id": 91, "nombre": "Teclado Mecánico RGB con Reposamanos Ergonómico Gaming", "categoria": "Periféricos", "precio": 130, "tags": ["keyboard","mechanical","rgb"]},
  {"id": 92, "nombre": "Mouse Gamer 16000 DPI", "categoria": "Periféricos", "precio": 95, "tags": ["mouse","gaming","dpi"]},
  {"id": 93, "nombre": "Mousepad XL RGB", "categoria": "Periféricos", "precio": 45, "tags": ["mousepad","rgb","gaming"]},
  {"id": 94, "nombre": "Control Inalámbrico PC", "categoria": "Periféricos", "precio": 110, "tags": ["controller","gaming","wireless"]},
  {"id": 95, "nombre": "Webcam Compacta HD", "categoria": "Periféricos", "precio": 75, "tags": ["webcam","office","usb"]},
  
  {"id": 96, "nombre": "Hub USB-C 8 en 1", "categoria": "Almacenamiento", "precio": 95, "tags": ["usb-c","hub","adapter"]},
  {"id": 97, "nombre": "SSD Externo 1TB", "categoria": "Almacenamiento", "precio": 180, "tags": ["ssd","storage","portable"]},
  {"id": 98, "nombre": "Disco Duro Externo 2TB", "categoria": "Almacenamiento", "precio": 150, "tags": ["hdd","backup","storage"]},
  {"id": 99, "nombre": "Base Enfriadora Laptop", "categoria": "Periféricos", "precio": 65, "tags": ["cooling","laptop","fan"]},
  {"id": 100, "nombre": "Power Bank 20000mAh", "categoria": "Electrónica", "precio": 85, "tags": ["battery","portable","power"]},
]

CATEGORIAS = list(set([p["categoria"] for p in PRODUCTOS]))

CATEGORIA_PESOS_BASE = {
  "Electrónica": 0.25,
  "Periféricos": 0.15,
  "Audio": 0.12,
  "Almacenamiento": 0.10,
  "Muebles": 0.10,
  "Iluminación": 0.08,
  "Fotografía": 0.05,
  "Streaming": 0.15,
}

def generar_perfil(rng):
    pesos_categorias = {}
    suma = 0
    for cat in CATEGORIAS:
        base = CATEGORIA_PESOS_BASE.get(cat, 0.1)
        factor = 0.2 + rng.random() * 1.8
        pesos_categorias[cat] = base * factor
        suma += pesos_categorias[cat]
        
    for cat in CATEGORIAS:
        pesos_categorias[cat] /= suma
        
    categorias_top = [cat for cat, _ in sorted(pesos_categorias.items(), key=lambda x: x[1], reverse=True)[:3]]
    productos_top = [p for p in PRODUCTOS if p["categoria"] in categorias_top]
    
    tags_pool = list(set([t for p in productos_top for t in p["tags"]]))
    k_tags = rng.randint(2, 5)
    tags_preferidos = rng.sample(tags_pool, min(k_tags, len(tags_pool)))
    
    niveles_precio = ["economico", "medio", "premium"]
    nivel = rng.choice(niveles_precio)
    if nivel == "economico":
        min_p, max_p = 20, 400
    elif nivel == "medio":
        min_p, max_p = 150, 1200
    else:
        min_p, max_p = 500, 2600
        
    return {
        "categoriasFavoritas": pesos_categorias,
        "tagsPreferidos": tags_preferidos,
        "rangoPrecio": [min_p, max_p]
    }

def generar_fecha(rng, inicio, fin):
    delta = fin - inicio
    random_seconds = rng.random() * delta.total_seconds()
    return inicio + datetime.timedelta(seconds=random_seconds)

def generar_compras_usuario(perfil, rng, cantidad_compras):
    compras = []
    productos_comprados_ids = set()
    inicio = datetime.datetime(2025, 1, 1)
    fin = datetime.datetime(2026, 6, 30)
    
    for _ in range(cantidad_compras):
        es_compra_de_perfil = rng.random() < 0.8
        
        if es_compra_de_perfil:
            candidatos = []
            for p in PRODUCTOS:
                if p["precio"] < perfil["rangoPrecio"][0] or p["precio"] > perfil["rangoPrecio"][1]:
                    continue
                peso = perfil["categoriasFavoritas"].get(p["categoria"], 0)
                tags_coincidentes = len([t for t in p["tags"] if t in perfil["tagsPreferidos"]])
                if peso > 0.08 or tags_coincidentes > 0:
                    candidatos.append(p)
        else:
            candidatos = PRODUCTOS
            
        if not candidatos:
            candidatos = PRODUCTOS
            
        productos_puntuados = []
        for p in candidatos:
            score = perfil["categoriasFavoritas"].get(p["categoria"], 0) * 100
            score += len([t for t in p["tags"] if t in perfil["tagsPreferidos"]]) * 15
            if p["id"] in productos_comprados_ids:
                score -= 30
            score += rng.random() * 20
            productos_puntuados.append((p, score))
            
        productos_puntuados.sort(key=lambda x: x[1], reverse=True)
        top = [x[0] for x in productos_puntuados[:min(5, len(productos_puntuados))]]
        seleccionado = rng.choice(top)
        
        productos_comprados_ids.add(seleccionado["id"])
        compras.append({
            "productoId": seleccionado["id"],
            "fecha": generar_fecha(rng, inicio, fin)
        })
        
    compras.sort(key=lambda c: c["fecha"])
    return compras

def generar_usuarios_sinteticos(cantidad=50, semilla=42, min_compras=3, max_compras=20):
    rng = random.Random(semilla)
    usuarios = []
    
    for i in range(cantidad):
        perfil = generar_perfil(rng)
        cantidad_compras = rng.randint(min_compras, max_compras)
        compras = generar_compras_usuario(perfil, rng, cantidad_compras)
        
        usuarios.append({
            "userId": i + 1,
            "perfil": perfil,
            "compras": compras
        })
        
    return usuarios

def dividir_train_test_por_usuario(usuario, ratio_train=0.8):
    compras = usuario["compras"]
    n_train = max(1, int(len(compras) * ratio_train))
    return {
        "train": compras[:n_train],
        "test": compras[n_train:]
    }

def estadisticas_dataset(usuarios):
    total_compras = sum(len(u["compras"]) for u in usuarios)
    promedio_compras = total_compras / len(usuarios) if usuarios else 0
    compras_por_categoria = {}
    
    for u in usuarios:
        for c in u["compras"]:
            prod = next((p for p in PRODUCTOS if p["id"] == c["productoId"]), None)
            if prod:
                compras_por_categoria[prod["categoria"]] = compras_por_categoria.get(prod["categoria"], 0) + 1
                
    return {
        "totalUsuarios": len(usuarios),
        "totalCompras": total_compras,
        "promedioCompras": round(promedio_compras, 2),
        "comprasPorCategoria": compras_por_categoria
    }
