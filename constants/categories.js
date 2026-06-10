export const CATEGORIES = {
  Jurídico:     ['Divorcio', 'Herencias', 'Laboral', 'Penal', 'Contratos', 'Otro'],
  Inmobiliario: ['Compraventa', 'Alquiler', 'Hipoteca', 'Tasación', 'Otro'],
  Reformas:     ['Cocina', 'Baño', 'Integral', 'Pintura', 'Fontanería', 'Otro'],
  Seguros:      ['Hogar', 'Vida', 'Auto', 'Salud', 'Empresa', 'Otro'],
}

export const STATUS_LABELS = {
  new:         'Nuevo',
  assigned:    'Reclamado',
  contacted:   'Contactado',
  in_progress: 'En progreso',
  closed_won:  'Cerrado ✓',
  closed_lost: 'Cerrado ✗',
}

export const empresaS = [
  { id: 'd1', name: 'Bufete García & Asociados', categories: ['Jurídico'],                 location: 'Madrid'    },
  { id: 'd2', name: 'Lex Inmobiliaria',          categories: ['Inmobiliario', 'Jurídico'], location: 'Madrid'    },
  { id: 'd3', name: 'Reformas Norte',            categories: ['Reformas'],                 location: 'Madrid'    },
  { id: 'd4', name: 'Seguros Pérez',             categories: ['Seguros'],                  location: 'Barcelona' },
  { id: 'd5', name: 'Legal360',                  categories: ['Jurídico'],                 location: 'Barcelona' },
  { id: 'd6', name: 'Hogar Total',               categories: ['Reformas', 'Inmobiliario'], location: 'Valencia'  },
]