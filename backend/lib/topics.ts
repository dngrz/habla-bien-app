export interface Topic {
  id: string;
  title: string;
  prompt: string;
}

export const TOPICS: Topic[] = [
  {
    id: 'redes-sociales',
    title: 'Redes sociales y adolescentes',
    prompt:
      '¿Deberían los adolescentes tener límites de tiempo en redes sociales? Defiende una postura con al menos dos argumentos.',
  },
  {
    id: 'tarea-escolar',
    title: 'Tareas escolares',
    prompt:
      '¿Es útil la tarea escolar para aprender o solo genera cansancio? Presenta tu posición y justifícala.',
  },
  {
    id: 'tecnologia-aula',
    title: 'Tecnología en el aula',
    prompt:
      '¿Deberían los colegios reemplazar los libros de texto por tablets? Argumenta a favor o en contra.',
  },
  {
    id: 'deporte-obligatorio',
    title: 'Deporte obligatorio',
    prompt:
      '¿Debería ser obligatorio practicar un deporte en el colegio? Explica por qué.',
  },
  {
    id: 'transporte-publico',
    title: 'Transporte público',
    prompt:
      '¿Cómo se podría mejorar el transporte público de tu ciudad? Propón una medida y defiéndela.',
  },
  {
    id: 'inteligencia-artificial',
    title: 'Inteligencia artificial',
    prompt:
      '¿La inteligencia artificial ayuda o perjudica el aprendizaje de los estudiantes? Toma una posición.',
  },
  {
    id: 'medio-ambiente',
    title: 'Medio ambiente',
    prompt:
      '¿Qué medida concreta debería tomar tu comunidad para reducir la contaminación? Justifica tu propuesta.',
  },
  {
    id: 'tiempo-libre',
    title: 'Tiempo libre',
    prompt:
      '¿Es mejor que los jóvenes usen su tiempo libre en actividades estructuradas o libres? Defiende una opción.',
  },
];

export function getRandomTopic(excludeId?: string): Topic {
  const pool = excludeId ? TOPICS.filter((t) => t.id !== excludeId) : TOPICS;
  const source = pool.length > 0 ? pool : TOPICS;
  return source[Math.floor(Math.random() * source.length)];
}

export function findTopic(id: string | undefined | null): Topic | undefined {
  if (!id) return undefined;
  return TOPICS.find((t) => t.id === id);
}
