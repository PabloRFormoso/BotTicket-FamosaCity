const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do cliente S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Faz upload de um arquivo para o S3 e retorna a URL pública
 * @param {string} filePath - Caminho local do arquivo
 * @param {string} fileName - Nome do arquivo no S3
 * @returns {Promise<string>} - URL pública do arquivo
 */
async function uploadToS3(filePath, fileName) {
    try {
        // Lê o conteúdo do arquivo
        const fileContent = fs.readFileSync(filePath);
        
        // Detecta o tipo de conteúdo baseado na extensão
        const ext = path.extname(fileName).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.html') {
            contentType = 'text/html';
        } else if (ext === '.txt') {
            contentType = 'text/plain';
        } else if (ext === '.json') {
            contentType = 'application/json';
        }

        // Parâmetros para o upload
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `transcripts/${fileName}`, // Pasta 'transcripts' no bucket
            Body: fileContent,
            ContentType: contentType,
            ACL: 'public-read', // Torna o arquivo publicamente acessível
        };

        // Executa o upload
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Constrói a URL pública do arquivo
        const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/transcripts/${fileName}`;
        
        console.log(`Arquivo enviado com sucesso para o S3: ${publicUrl}`);
        return publicUrl;
        
    } catch (error) {
        console.error('Erro ao fazer upload para o S3:', error);
        throw error;
    }
}

/**
 * Faz upload de um buffer para o S3 e retorna a URL pública
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo no S3
 * @param {string} contentType - Tipo de conteúdo do arquivo
 * @returns {Promise<string>} - URL pública do arquivo
 */
async function uploadBufferToS3(buffer, fileName, contentType = 'text/html') {
    try {
        // Parâmetros para o upload
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `transcripts/${fileName}`, // Pasta 'transcripts' no bucket
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read', // Torna o arquivo publicamente acessível
        };

        // Executa o upload
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Constrói a URL pública do arquivo
        const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/transcripts/${fileName}`;
        
        console.log(`Buffer enviado com sucesso para o S3: ${publicUrl}`);
        return publicUrl;
        
    } catch (error) {
        console.error('Erro ao fazer upload do buffer para o S3:', error);
        throw error;
    }
}

module.exports = {
    uploadToS3,
    uploadBufferToS3
};
