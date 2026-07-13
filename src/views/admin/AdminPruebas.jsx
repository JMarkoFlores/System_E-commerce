import React from 'react';
import { FlaskConical, Beaker, TestTube, Microscope } from 'lucide-react';

const AdminPruebas = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <FlaskConical className="mr-3 text-purple-600" size={32} />
          Módulo de Pruebas
        </h2>
        <p className="text-gray-600 mt-1">Espacio reservado para pruebas robustas del sistema</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-2xl p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-white p-6 rounded-full shadow-lg">
            <Microscope className="text-purple-600" size={64} />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Pruebas Robustas</h3>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Este módulo está preparado para alojar pruebas unitarias, de integración,
          end-to-end y de rendimiento del sistema de recomendación, pasarela de pagos
          y panel administrativo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <TestTube className="mx-auto mb-4 text-blue-600" size={32} />
            <h4 className="font-bold text-gray-800 mb-2">Pruebas Unitarias</h4>
            <p className="text-sm text-gray-600">Validación de funciones y componentes individuales</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Beaker className="mx-auto mb-4 text-green-600" size={32} />
            <h4 className="font-bold text-gray-800 mb-2">Pruebas de Integración</h4>
            <p className="text-sm text-gray-600">Flujo completo entre frontend, backend y base de datos</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <FlaskConical className="mx-auto mb-4 text-purple-600" size={32} />
            <h4 className="font-bold text-gray-800 mb-2">Pruebas de IA</h4>
            <p className="text-sm text-gray-600">Validación del modelo de recomendación con TensorFlow.js</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Estado del Módulo</h3>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <p className="text-gray-700">En desarrollo - listo para implementar casos de prueba</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPruebas;
