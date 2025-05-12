const API_URL = 'https://script.google.com/macros/s/AKfycbxn4KZ9ZU80FHNmxWlEmHqK1y41ng6Ai1NAwbOXNT5Y5a5UPZx9LBZ3Et5Wa4SsM8ZeJw/exec';

console.log('API_URL définie:', API_URL);

// Classe pour gérer les appels API
class ApiClient {
    // Méthode générique pour envoyer des requêtes
    static async sendRequest(action, params = {}) {
        console.log(`[API] Préparation requête pour action "${action}"`, params);

        if (API_URL === 'https://script.google.com/macros/s/VOTRE_ID_DE_DÉPLOIEMENT/exec') {
            console.error('[API] ERREUR: Vous devez remplacer "VOTRE_ID_DE_DÉPLOIEMENT" dans api-client.js par l\'ID réel de votre déploiement Apps Script');
            return { success: false, error: 'URL API non configurée' };
        }

        const requestData = {
            action,
            ...params
        };
        
        console.log(`[API] Envoi de requête "${action}" à: ${API_URL}`);
        console.log('[API] Données envoyées:', JSON.stringify(requestData));
        
        try {
            console.log('[API] Début fetch...');
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            console.log(`[API] Réponse reçue avec statut: ${response.status}`);
            
            if (!response.ok) {
                console.error(`[API] Erreur HTTP: ${response.status}`);
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const jsonResponse = await response.json();
            console.log('[API] Données reçues:', jsonResponse);
            return jsonResponse;
        } catch (error) {
            console.error('[API] Erreur lors de la requête:', error);
            
            // Message spécifique pour l'erreur CORS
            if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
                console.error('[API] Erreur CORS détectée. Vérifiez que le script Apps Script est correctement configuré avec doOptions()');
            }
            
            return { success: false, error: error.toString() };
        }
    }
    
    // Récupérer toutes les créations
    static async getCreations() {
        console.log('[API] Appel de getCreations()');
        return await this.sendRequest('getCreations');
    }
    
    // Ajouter un like à une création
    static async addLike(creationId) {
        console.log(`[API] Appel de addLike() pour creationId: ${creationId}`);
        return await this.sendRequest('addLike', { creationId });
    }
    
    // Récupérer les commentaires d'une création
    static async getComments(creationId) {
        console.log(`[API] Appel de getComments() pour creationId: ${creationId}`);
        return await this.sendRequest('getComments', { creationId });
    }
    
    // Ajouter un commentaire
    static async addComment(creationId, author, content) {
        console.log(`[API] Appel de addComment() pour creationId: ${creationId}, auteur: ${author}`);
        return await this.sendRequest('addComment', { creationId, author, content });
    }
    
    // Soumettre un message de contact
    static async submitContact(name, email, message, publicMessage) {
        console.log(`[API] Appel de submitContact() pour ${name} (${email})`);
        return await this.sendRequest('submitContact', { name, email, message, publicMessage });
    }
    
    // Vérifier les identifiants admin
    static async verifyAdmin(password) {
        console.log('[API] Appel de verifyAdmin()');
        return await this.sendRequest('verifyAdmin', { password });
    }
    
    // Récupérer les commentaires non approuvés (admin)
    static async getUnapprovedComments() {
        console.log('[API] Appel de getUnapprovedComments()');
        return await this.sendRequest('getUnapprovedComments');
    }
    
    // Approuver un commentaire
    static async approveComment(commentId) {
        console.log(`[API] Appel de approveComment() pour commentId: ${commentId}`);
        return await this.sendRequest('approveComment', { commentId });
    }
    
    // Rejeter un commentaire
    static async rejectComment(commentId) {
        console.log(`[API] Appel de rejectComment() pour commentId: ${commentId}`);
        return await this.sendRequest('rejectComment', { commentId });
    }
}

// Test immédiat de la connexion à l'API lors du chargement de la page
window.addEventListener('DOMContentLoaded', async () => {
    console.log('[API] Test de connexion à l\'API...');
    try {
        // Utiliser fetch directement pour tester la connexion
        const testResponse = await fetch(API_URL, {
            method: 'GET'
        });
        console.log(`[API] Test de connexion réussi, statut: ${testResponse.status}`);
        try {
            const jsonResponse = await testResponse.json();
            console.log('[API] Réponse de test:', jsonResponse);
        } catch (e) {
            console.log('[API] La réponse n\'est pas au format JSON, cela peut être normal pour une requête GET');
        }
    } catch (error) {
        console.error('[API] Test de connexion échoué:', error);
        if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
            console.error('[API] PROBLÈME CORS: Le script Apps Script doit avoir une fonction doOptions() correctement configurée');
        }
        if (API_URL.includes('VOTRE_ID_DE_DÉPLOIEMENT')) {
            console.error('[API] Vous devez remplacer "VOTRE_ID_DE_DÉPLOIEMENT" par l\'ID réel de votre déploiement Apps Script');
        }
    }
});

console.log('api-client.js chargé avec succès');
