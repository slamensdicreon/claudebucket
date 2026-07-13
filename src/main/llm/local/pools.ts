export const NOMBRES = [
  'María José', 'Carlos', 'Ana Sofía', 'Luis', 'Camila', 'Diego', 'Valentina', 'Andrés',
  'Isabella', 'Javier', 'Lucía', 'Miguel', 'Daniela', 'Sebastián', 'Fernanda', 'Ricardo',
  'Paula', 'Alejandro', 'Gabriela', 'Tomás', 'Renata', 'Emilio', 'Antonia', 'Nicolás'
]

export const APELLIDOS = [
  'Ramírez', 'García', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Gómez', 'Díaz',
  'Torres', 'Vargas', 'Castro', 'Rojas', 'Morales', 'Ortiz', 'Silva', 'Mendoza'
]

export const CIUDADES: Array<{ ciudad: string; pais: string }> = [
  { ciudad: 'Bogotá', pais: 'Colombia' },
  { ciudad: 'Medellín', pais: 'Colombia' },
  { ciudad: 'Ciudad de México', pais: 'México' },
  { ciudad: 'Guadalajara', pais: 'México' },
  { ciudad: 'Lima', pais: 'Perú' },
  { ciudad: 'Santiago', pais: 'Chile' },
  { ciudad: 'Buenos Aires', pais: 'Argentina' },
  { ciudad: 'São Paulo', pais: 'Brasil' },
  { ciudad: 'Quito', pais: 'Ecuador' },
  { ciudad: 'Montevideo', pais: 'Uruguay' }
]

export const OCUPACIONES = [
  'diseñadora gráfica', 'ingeniero de software', 'profesora', 'contador', 'emprendedora',
  'enfermero', 'analista de marketing', 'chef', 'abogada', 'conductor de plataforma',
  'administradora de empresas', 'arquitecto', 'psicóloga', 'vendedor', 'periodista'
]

export const GENEROS = ['femenino', 'masculino', 'no binario']

export const NIVELES_EDUCATIVOS = ['secundaria', 'técnico', 'universitario', 'posgrado']

export const ESTADOS_CIVILES = ['soltero/a', 'casado/a', 'unión libre', 'divorciado/a']

export const RASGOS = [
  'analítica', 'impulsivo', 'ahorradora', 'curioso', 'escéptica ante la publicidad',
  'early adopter', 'fiel a las marcas que conoce', 'sensible al precio', 'orientado a la familia',
  'activo en redes sociales', 'práctico', 'exigente con la calidad'
]

export const VALORES = [
  'sostenibilidad', 'calidad sobre precio', 'conveniencia', 'estatus', 'salud',
  'comunidad local', 'innovación', 'tradición', 'transparencia de marca'
]

export const CANALES = ['Instagram', 'WhatsApp', 'TikTok', 'correo electrónico', 'boca a boca', 'Facebook']

export const OBJECIONES_TIPICAS = [
  'precio percibido alto frente a la competencia',
  'desconfianza ante marcas nuevas',
  'dudas sobre tiempos de entrega',
  'falta de reseñas de otros usuarios',
  'preferencia por comprar en tienda física'
]

export const HISTORIA_TEMPLATES = [
  (nombre: string, ocupacion: string, ciudad: string) =>
    `${nombre} trabaja como ${ocupacion} en ${ciudad} y suele tomar decisiones de compra investigando bastante antes de decidirse. Valora las recomendaciones de gente cercana por encima de la publicidad tradicional.`,
  (nombre: string, ocupacion: string, ciudad: string) =>
    `${nombre} es ${ocupacion} en ${ciudad}, con una rutina ocupada entre semana. Compra sobre todo por conveniencia y le gusta probar cosas nuevas si un amigo se las recomienda primero.`,
  (nombre: string, ocupacion: string, ciudad: string) =>
    `${nombre} vive en ${ciudad} y trabaja como ${ocupacion}. Es cuidadoso con su presupuesto mensual y compara varias opciones antes de comprar algo que no sea de primera necesidad.`
]
