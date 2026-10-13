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
};
