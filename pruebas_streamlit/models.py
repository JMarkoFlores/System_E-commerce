import random
import math
from data import PRODUCTOS, CATEGORIAS

class RandomRecommender:
    def __init__(self, seed=123):
        self.seed = seed
        self.rng = random.Random(seed)

    def recomendar(self, historial_train, n=10):
        comprados_ids = {h["productoId"] for h in historial_train}
        candidatos = [p for p in PRODUCTOS if p["id"] not in comprados_ids]
        
        # shuffle
        self.rng.shuffle(candidatos)
        return candidatos[:n]

class PopularityRecommender:
    def __init__(self):
        self.popularidad = self.calcular_popularidad()

    def calcular_popularidad(self):
        pop_list = []
        for p in PRODUCTOS:
            score = 0
            if p["categoria"] == "Electrónica": score += 30
            if p["categoria"] == "Streaming": score += 20
            if p["categoria"] == "Periféricos": score += 15
            if p["categoria"] == "Audio": score += 12
            if p["categoria"] == "Muebles": score += 10
            if p["categoria"] == "Almacenamiento": score += 10
            if p["categoria"] == "Iluminación": score += 8
            if p["categoria"] == "Fotografía": score += 5
            
            score += max(0, 25 - abs(p["precio"] - 500) / 40)
            
            tags_populares = ["gaming", "laptop", "smartphone", "ssd", "headphones", "webcam"]
            score += len([t for t in p["tags"] if t in tags_populares]) * 5
            
            pop_list.append({"producto": p, "score": score})
            
        pop_list.sort(key=lambda x: x["score"], reverse=True)
        return pop_list

    def recomendar(self, historial_train, n=10):
        comprados_ids = {h["productoId"] for h in historial_train}
        candidatos = [item["producto"] for item in self.popularidad if item["producto"]["id"] not in comprados_ids]
        return candidatos[:n]

class ContentBasedRecommender:
    def __init__(self):
        self.todos_los_tags = list(set([t for p in PRODUCTOS for t in p["tags"]]))
        self.vectores = {}
        for p in PRODUCTOS:
            self.vectores[p["id"]] = self.vectorizar_producto(p)

    def vectorizar_producto(self, producto):
        vec = []
        for cat in CATEGORIAS:
            vec.append(1 if producto["categoria"] == cat else 0)
        for tag in self.todos_los_tags:
            vec.append(1 if tag in producto["tags"] else 0)
        vec.append(producto["precio"] / 2500)
        return vec

    def similitud_coseno(self, a, b):
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a)
        norm_b = sum(x * x for x in b)
        if norm_a == 0 or norm_b == 0:
            return 0
        return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))

    def perfil_usuario(self, historial_train):
        dim = len(CATEGORIAS) + len(self.todos_los_tags) + 1
        if not historial_train:
            return [0] * dim
        
        perfil = [0] * dim
        for h in historial_train:
            vec = self.vectores[h["productoId"]]
            for i in range(dim):
                perfil[i] += vec[i]
                
        return [v / len(historial_train) for v in perfil]

    def recomendar(self, historial_train, n=10):
        comprados_ids = {h["productoId"] for h in historial_train}
        perfil = self.perfil_usuario(historial_train)
        
        similitudes = []
        for p in PRODUCTOS:
            if p["id"] not in comprados_ids:
                sim = self.similitud_coseno(perfil, self.vectores[p["id"]])
                similitudes.append({"producto": p, "score": sim})
                
        similitudes.sort(key=lambda x: x["score"], reverse=True)
        return [s["producto"] for s in similitudes[:n]]

class HybridWeightedRecommender:
    def __init__(self):
        self.pop_recommender = PopularityRecommender()
        self.cb_recommender = ContentBasedRecommender()

    def recomendar(self, historial_train, n=10):
        comprados_ids = {h["productoId"] for h in historial_train}
        
        cb_perfil = self.cb_recommender.perfil_usuario(historial_train)
        cb_scores = {}
        for p in PRODUCTOS:
            if p["id"] not in comprados_ids:
                cb_scores[p["id"]] = self.cb_recommender.similitud_coseno(cb_perfil, self.cb_recommender.vectores[p["id"]])
                
        pop_scores = {}
        for item in self.pop_recommender.popularidad:
            if item["producto"]["id"] not in comprados_ids:
                pop_scores[item["producto"]["id"]] = item["score"]
                
        max_pop = max(pop_scores.values()) if pop_scores else 0
        
        hibrido = []
        for pid, cb_score in cb_scores.items():
            pop_score = pop_scores.get(pid, 0) / max_pop if max_pop > 0 else 0
            score = (cb_score * 0.7) + (pop_score * 0.3)
            producto = next((p for p in PRODUCTOS if p["id"] == pid), None)
            if producto:
                hibrido.append({"producto": producto, "score": score})
                
        hibrido.sort(key=lambda x: x["score"], reverse=True)
        return [h["producto"] for h in hibrido[:n]]

class HybridCascadeRecommender:
    def __init__(self):
        self.pop_recommender = PopularityRecommender()

    def recomendar(self, historial_train, n=10):
        comprados_ids = {h["productoId"] for h in historial_train}
        if not historial_train:
            return PRODUCTOS[:n]
            
        categorias_interes = set()
        for h in historial_train:
            prod = next((p for p in PRODUCTOS if p["id"] == h["productoId"]), None)
            if prod:
                categorias_interes.add(prod["categoria"])
                
        candidatos = [p for p in PRODUCTOS if p["categoria"] in categorias_interes and p["id"] not in comprados_ids]
        
        if len(candidatos) < n:
            otros = [p for p in PRODUCTOS if p["categoria"] not in categorias_interes and p["id"] not in comprados_ids]
            candidatos.extend(otros)
            
        pop_map = {item["producto"]["id"]: item["score"] for item in self.pop_recommender.popularidad}
        
        candidatos.sort(key=lambda x: pop_map.get(x["id"], 0), reverse=True)
        return candidatos[:n]
