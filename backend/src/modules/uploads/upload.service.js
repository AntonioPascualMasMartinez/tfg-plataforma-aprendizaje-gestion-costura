const cloudinary = require('../../config/cloudinary');
const ApiError = require('../../utils/apiError');

class UploadService {
  /**
   * Genera una credencial criptográfica temporal (Firma) para que el cliente (Angular)
   * pueda subir archivos directamente a Cloudinary sin exponer el API Secret.
   * * @param {string} folderName - Carpeta destino en Cloudinary (ej. 'projects', 'avatars')
   * @returns {Object} Payload con la firma, timestamp y claves públicas.
   */
  static generateSignature(folderName = 'costura_projects') {
    try {
      // 1. Generar un Timestamp actual en formato UNIX (segundos)
      const timestamp = Math.round(new Date().getTime() / 1000);

      // 2. Definir los parámetros exactos que el cliente utilizará en la subida y que deben ser firmados
      const paramsToSign = {
        timestamp: timestamp,
        folder: folderName,
      };

      // 3. Generar la firma SHA usando el SDK y el secreto (que nunca sale del backend)
      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET,
      );

      // 4. Retornar el paquete de credenciales seguras al cliente
      return {
        timestamp,
        signature,
        folder: folderName,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      };
    } catch (error) {
      // Capturamos cualquier error (ej. SDK mal configurado) y lo marcamos como fallo de servidor no operacional
      throw new ApiError(
        500,
        'Error interno al generar la firma criptográfica para el servidor multimedia.',
        false,
      );
    }
  }
}

module.exports = UploadService;
