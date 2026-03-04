const UploadService = require('../../src/modules/uploads/upload.service');
const cloudinary = require('../../config/cloudinary');

// Mockear el SDK de Cloudinary
jest.mock('../../config/cloudinary', () => ({
  utils: {
    api_sign_request: jest.fn(),
  },
}));

describe('UploadService - Pruebas Unitarias', () => {
  beforeAll(() => {
    process.env.CLOUDINARY_API_SECRET = 'secreto_falso';
    process.env.CLOUDINARY_API_KEY = 'key_falsa';
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud_falso';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSignature()', () => {
    it('Debe generar una firma válida y devolver los metadatos correctos', () => {
      // Simular que Cloudinary genera un hash SHA ficticio
      cloudinary.utils.api_sign_request.mockReturnValue('hash_sha_12345');

      const result = UploadService.generateSignature('test_folder');

      expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'test_folder', timestamp: expect.any(Number) }),
        'secreto_falso',
      );

      expect(result).toHaveProperty('signature', 'hash_sha_12345');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('cloudName', 'cloud_falso');
      expect(result).toHaveProperty('apiKey', 'key_falsa');
    });

    it('Debe usar "costura_projects" como carpeta por defecto si no se proporciona una', () => {
      cloudinary.utils.api_sign_request.mockReturnValue('hash_default');

      const result = UploadService.generateSignature();

      expect(result.folder).toBe('costura_projects');
    });
  });
});
