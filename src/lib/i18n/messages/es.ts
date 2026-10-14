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
};
