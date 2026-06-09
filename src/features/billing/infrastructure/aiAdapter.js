import { GoogleGenerativeAI } from '@google/generative-ai';

// Instanciamos el cliente usando la variable de entorno
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');

// System prompt con el contexto exclusivo de soporte
const SYSTEM_INSTRUCTION = `
Eres el asistente de soporte técnico y administrativo de VacacionalPag, una plataforma de cursos vacacionales.
Tu ÚNICO propósito es responder preguntas frecuentes sobre soporte, pagos, inscripciones y problemas en la plataforma.
Bajo ninguna circunstancia debes recomendar cursos específicos ni actuar como tutor o guía académico. Si te preguntan sobre qué curso tomar o recomendaciones de estudio, debes decir amablemente que tu función es estrictamente de soporte y que el estudiante puede revisar el catálogo.

Reglas del negocio y respuestas frecuentes:
1. Pagos con Stripe (Tarjeta): Son automáticos. Si el estudiante paga con Stripe y el curso no aparece en "Mis Cursos", debe cerrar sesión y volver a entrar. Si persiste, debe crear un ticket con el comprobante de pago.
2. Pagos Manuales (Transferencia/Efectivo): Después de seleccionar "Transferencia", el estado de la matrícula queda como "pendiente". El pago manual tarda hasta 24 horas hábiles en reflejarse. Si pasan más de 24 horas, el usuario debe enviar el comprobante de pago al correo de soporte: pagos@vacacionalpag.edu.co.
3. Descarga de Certificados: Los certificados solo se habilitan para descargar cuando el curso marca un progreso del 100%. Aparecen en la pestaña "Mis Cursos".
4. Fechas y Horarios: Los detalles de inicio están en el catálogo, en la ficha técnica de cada curso.
5. Iniciar un curso: Para entrar a un curso matriculado, el usuario debe ir al panel "Mis Cursos".

Tono: Profesional, amable, directo y conciso. Evita usar formato de texto excesivo.
`;

export class GeminiSupportAdapter {
  constructor() {
    if (!apiKey) {
      console.warn("No se encontró VITE_GEMINI_API_KEY. El asistente no funcionará correctamente.");
    }
    
    this.model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    this.chatSession = this.model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hola" }],
        },
        {
          role: "model",
          parts: [{ text: "¡Hola! Soy el Asistente de Soporte de VacacionalPag. Estoy aquí para ayudarte con problemas de plataforma, estados de pagos e inscripciones. ¿En qué te puedo ayudar hoy?" }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.3, // Temperatura baja para precisión
      },
    });
  }

  async sendMessage(userMessage) {
    try {
      const result = await this.chatSession.sendMessage(userMessage);
      return {
        success: true,
        text: result.response.text(),
      };
    } catch (error) {
      console.error("Error AI Support:", error);
      return {
        success: false,
        text: "Lo siento, en este momento nuestros servicios de inteligencia artificial están saturados o hubo un error de conexión. Por favor, envía un ticket clásico."
      };
    }
  }
}

// Exportamos una instancia única
export const aiSupportService = new GeminiSupportAdapter();

// --- NUEVO: Copiloto de Creación de Cursos ---
const COPILOT_SYSTEM_INSTRUCTION = `
Eres el Planificador Académico Experto de VacacionalPag. 
Tu trabajo es recibir el TÍTULO de un curso vacacional y devolver un JSON estricto con los detalles sugeridos del curso.
Debes devolver ÚNICAMENTE el JSON crudo, sin formato de markdown (ni \`\`\`json ni nada más), que pueda ser parseado directamente por JSON.parse().
Estructura obligatoria:
{
  "description": "Una descripción atractiva y comercial del curso (2 a 3 líneas)",
  "price": 45.99, 
  "capacity": 25, 
  "days_of_week": "Lunes, Miércoles, Viernes", 
  "start_time": "14:00", 
  "end_time": "16:00" 
}
`;

export class GeminiCourseCopilotAdapter {
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: COPILOT_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.7, // Un poco más creativo para generar buenas descripciones
      }
    });
  }

  async generateCourseDetails(title) {
    try {
      const result = await this.model.generateContent(`Genera detalles para el curso titulado: "${title}"`);
      const text = result.response.text().trim();
      
      // Intentar limpiar posibles backticks de markdown si la IA desobedece
      let cleanJson = text;
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Error AI Copilot:", error);
      throw new Error("No se pudo generar la información desde la IA.");
    }
  }
}

export const aiCourseCopilot = new GeminiCourseCopilotAdapter();

// --- NUEVO: Generador de Insights de Negocio ---
const INSIGHTS_SYSTEM_INSTRUCTION = `
Eres un Analista de Negocios y Estrategia Senior de VacacionalPag.
Se te entregará un JSON con las métricas actuales de la plataforma (ganancias, inscripciones, curso más popular, ocupación).
Tu objetivo es devolver un breve reporte narrativo (máximo 3 párrafos cortos, usando viñetas) con:
1. Una evaluación general del desempeño actual.
2. Una conclusión sobre el curso más popular.
3. Una recomendación estratégica (ej. sugerir clonar un curso si hay mucha ocupación).
Responde directamente, sin preámbulos robóticos.
`;

export class AITrendAnalyzerAdapter {
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: INSIGHTS_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.6,
      }
    });
  }

  async generateInsights(metricsData) {
    try {
      const dataString = JSON.stringify(metricsData, null, 2);
      const result = await this.model.generateContent(`Genera insights estratégicos basados en estas métricas de negocio:\n${dataString}`);
      return result.response.text().trim();
    } catch (error) {
      console.error("Error AI Insights:", error);
      throw new Error("No se pudo generar el análisis de IA. Detalles: " + error.message);
    }
  }
}

export const aiTrendAnalyzer = new AITrendAnalyzerAdapter();
