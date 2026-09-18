const dictionaries = {
  es: () => import('./es.json').then((module) => module.default),
  en: () => import('./en.json').then((module) => module.default),
  sq: () => import('./sq.json').then((module) => module.default),
};

export const getDictionary = async (locale: 'es' | 'en' | 'sq') => {
  // Retorna español por defecto si el idioma no existe
  return dictionaries[locale]?.() ?? dictionaries.es();
};