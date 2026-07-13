// src/utils/RedNeuronalWrapper.js
// Wrapper que adapta RedNeuronalRecomendacion al interfaz del framework de evaluación

import RedNeuronalRecomendacion from "./RedNeuronal";

/**
 * Wrapper para evaluar la Red Neuronal dentro del framework de evaluación offline.
 * Implementa los métodos:
 *   - async reiniciar()
 *   - async recomendar(historialTrain, n)
 *
 * Internamente entrena el modelo con el historial de entrenamiento antes de recomendar.
 */
export class RedNeuronalEvaluator {
  constructor() {
    this.modelo = new RedNeuronalRecomendacion();
  }

  async reiniciar() {
    // Liberar modelo anterior y crear uno nuevo para evitar data leakage entre folds
    if (this.modelo) {
      await this.modelo.reiniciar();
    } else {
      this.modelo = new RedNeuronalRecomendacion();
    }
  }

  async recomendar(historialTrain, n = 10) {
    if (!historialTrain || historialTrain.length === 0) {
      return [];
    }

    // Reiniciar modelo para evitar data leakage entre usuarios/folds
    await this.reiniciar();

    // Entrenar con el historial de entrenamiento del usuario actual
    await this.modelo.entrenar(historialTrain);

    // Generar recomendaciones (filtra automáticamente productos ya comprados)
    return await this.modelo.recomendar(historialTrain, n);
  }

  obtenerEstadisticas() {
    return this.modelo.obtenerEstadisticas();
  }
}

export default RedNeuronalEvaluator;
