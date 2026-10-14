import type { Translation } from '../translator';
import type { en } from './en';

/** The Spanish of every message in `en.ts`, written for Spain. A missing key does not compile. */
export const es: Translation<typeof en> = {
  'brand.name': 'Agenda',

  // Screens shown while the app is not ready to be used
  'app.loading.title': 'Preparando tu agenda.',
  'app.session.title': 'Te damos la bienvenida de nuevo.',
  'app.session.loading': 'Cargando tu sesión...',
  'app.status.checking': 'Comprobando la API...',
  'app.status.ready': 'La API está en marcha.',
  'app.status.waking':
    'Despertando el servidor. El alojamiento gratuito se duerme cuando no se usa; suele tardar menos de un minuto.',
  'app.status.error': 'No se pudo conectar con la API. Prueba a recargar en un momento.',
  'app.status.elapsed': '{message} ({seconds}s)',

  // The frame around every signed-in screen
  'shell.skipLink': 'Saltar a la agenda',
  'shell.account': 'Cuenta',
  'shell.demoNote': 'Cuenta de demostración. Se elimina al cabo de un día.',
  'shell.logOut': 'Cerrar sesión',
  'shell.version': 'web {version}',

  // How reads, writes and notices behave everywhere
  'query.retry': 'Reintentar',
  'query.stale': 'No se pudo actualizar y puede que esté desactualizado.',
  'notice.dismiss': 'Descartar',

  // What to tell the user when a request fails
  'error.generic': 'Algo ha fallado por nuestra parte. Inténtalo de nuevo en un momento.',
  'error.NETWORK_ERROR':
    'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
  'error.UNAUTHORIZED': 'Tu sesión ha terminado. Inicia sesión de nuevo para continuar.',
  'error.FORBIDDEN': 'Se rechazó esa solicitud. Recarga la página e inténtalo de nuevo.',
  'error.NOT_FOUND': 'Ese elemento ya no existe. Puede que se haya eliminado en otro sitio.',
  'error.PRECONDITION_FAILED':
    'Esto se cambió en otro sitio mientras tanto. Ahora ves la última versión; inténtalo de nuevo.',
  'error.VALIDATION_ERROR': 'Algo de eso no era válido. Revisa los campos e inténtalo de nuevo.',
  'error.PAYLOAD_TOO_LARGE': 'Es demasiado para guardarlo de una vez.',
  'auth.invalidCredentials': 'Ese correo y esa contraseña no coinciden.',

  // The corner of the screen where preferences are changed
  'dock.label': 'Preferencias',
  'language.label': 'Idioma',
  'language.loadFailed':
    'No se pudo cargar ese idioma. Comprueba tu conexión e inténtalo de nuevo.',

  // The sign-in screen
  'auth.hero.title': 'Dale una hora a cada tarea.',
  'auth.hero.lead':
    'Agenda reúne tus tareas y tus eventos en una sola línea de tiempo, para que el plan que haces sea un día que de verdad puedas cumplir.',
  'auth.points.drag': 'Arrastra una tarea al día para darle una hora.',
  'auth.points.keyboard': 'Todo lo que puedes arrastrar, también puedes hacerlo con el teclado.',
  'auth.points.safe': 'Los cambios se ven al instante y se deshacen si no se pueden guardar.',
  'auth.demo.title': '¿Solo estás echando un vistazo?',
  'auth.demo.text': 'Abre un día ya preparado y pruébalo. Sin registrarte y sin configurar nada.',
  'auth.demo.button': 'Probar la demo',
  'auth.divider.logIn': 'o inicia sesión',
  'auth.divider.register': 'o crea una cuenta',
  'auth.logIn': 'Iniciar sesión',
  'auth.register.heading': 'Crea tu cuenta',
  'auth.register.submit': 'Crear cuenta',
  'auth.register.switch': 'Crear una cuenta',
  'auth.field.name': 'Nombre',
  'auth.field.email': 'Correo electrónico',
  'auth.field.password': 'Contraseña',
  'auth.submit.working': 'Un momento...',
  'auth.switch.newHere': '¿Primera vez por aquí?',
  'auth.switch.haveAccount': '¿Ya tienes cuenta?',
  'auth.preview.day': 'Lunes',
  'auth.preview.standUp': 'Reunión diaria',
  'auth.preview.checklist': 'Preparar la lista del lanzamiento',
  'auth.preview.lunch': 'Comida con Marta',
  'auth.preview.task': 'Redactar las notas de la versión',

  // The day on screen
  'timeline.title': 'Línea de tiempo',
  'timeline.addBlock': 'Añadir bloque',
  'timeline.loading': 'Cargando el día...',
  'timeline.needCalendar': 'Añade primero un calendario: cada bloque pertenece a uno.',
  'timeline.empty.title': 'Un día despejado',
  'timeline.empty.hint':
    'Todavía no hay nada planificado. Haz clic en la cuadrícula, pulsa {addBlock} o arrastra una tarea aquí.',
  'timeline.allDay': 'Todo el día',
  'timeline.blocks': 'Bloques',
  'timeline.shortcuts':
    'Pulsa la flecha arriba o abajo para mover el bloque 15 minutos. Mantén Mayús con una flecha para acortarlo o alargarlo. Pulsa Suprimir para eliminarlo.',
  'timeline.date.today': 'Hoy',
  'timeline.date.previous': 'Día anterior',
  'timeline.date.next': 'Día siguiente',
  'timeline.date.goTo': 'Ir a la fecha',

  // The details of one block
  'block.new': 'Nuevo bloque',
  'block.details': 'Detalles',
  'block.close': 'Cerrar',
  'block.title': 'Título',
  'block.calendar': 'Calendario',
  'block.start': 'Inicio',
  'block.end': 'Fin',
  'block.linkedTask': 'Tiempo reservado para «{title}».',
  'block.save': 'Guardar',
  'block.delete': 'Eliminar bloque',
  'block.endAfterStart': 'El final tiene que ser posterior al inicio.',

  // Tasks
  'tasks.title': 'Tareas',
  'tasks.openCount': { one: '{count} abierta', other: '{count} abiertas' },
  'tasks.new': 'Nueva tarea',
  'tasks.dueDate': 'Fecha límite',
  'tasks.estimate': 'Estimación en minutos',
  'tasks.add': 'Añadir tarea',
  'tasks.loading': 'Cargando tareas...',
  'tasks.empty.title': 'Aún no hay tareas',
  'tasks.empty.hint': 'Añade la primera arriba y luego dale una hora en el día.',
  'tasks.item.drag': 'Arrastra al día',
  'tasks.item.planned': 'planificada',
  'tasks.item.plan': 'Planificar',
  'tasks.item.planLabel': 'Planificar {title}',
  'tasks.item.deleteLabel': 'Eliminar {title}',

  // Calendars
  'calendars.title': 'Calendarios',
  'calendars.new': 'Nuevo calendario',
  'calendars.color': 'Color',
  'calendars.add': 'Añadir calendario',
  'calendars.loading': 'Cargando calendarios...',
  'calendars.empty.title': 'Aún no hay calendarios',
  'calendars.empty.hint': 'Cada bloque vive en un calendario, así que añade uno primero.',
  'calendars.colors.blue': 'Azul',
  'calendars.colors.green': 'Verde',
  'calendars.colors.purple': 'Morado',
  'calendars.colors.rose': 'Rosa',

  // Read out for those who cannot see a block move
  'announce.planned': 'Planificada {title} para {time}.',
  'announce.moved': 'Movido {title}: {time}.',
  'announce.resized': 'Cambiada la duración de {title}: {time}.',
  'announce.deleted': 'Eliminado {title}.',
};
