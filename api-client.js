// Remplacer cette URL par l'URL publiée de votre script Apps Script
const API_URL = 'https://script.google.com/macros/s/VOTRE_ID_DE_DÉPLOIEMENT/exec';

// Classe pour gérer les appels API
class ApiClient {
    // Méthode générique pour envoyer des requêtes
    static async sendRequest(action, params = {}) {
        const requestData = {
            action,
            ...params
        };
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            
            return await response.json();
        } catch (error) {
            console.error('Erreur API:', error);
            return { success: false, error: error.toString() };
        }
    }
    
    // Récupérer toutes les créations
    static async getCreations() {
        return await this.sendRequest('getCreations');
    }
    
    // Ajouter un like à une création
    static async addLike(creationId) {
        return await this.sendRequest('addLike', { creationId });
    }
    
    // Récupérer les commentaires d'une création
    static async getComments(creationId) {
        return await this.sendRequest('getComments', { creationId });
    }
    
    // Ajouter un commentaire
    static async addComment(creationId, author, content) {
        return await this.sendRequest('addComment', { creationId, author, content });
    }
    
    // Soumettre un message de contact
    static async submitContact(name, email, message, publicMessage) {
        return await this.sendRequest('submitContact', { name, email, message, publicMessage });
    }
    
    // Vérifier les identifiants admin
    static async verifyAdmin(password) {
        return await this.sendRequest('verifyAdmin', { password });
    }
    
    // Récupérer les commentaires non approuvés (admin)
    static async getUnapprovedComments() {
        return await this.sendRequest('getUnapprovedComments');
    }
    
    // Approuver un commentaire
    static async approveComment(commentId) {
        return await this.sendRequest('approveComment', { commentId });
    }
    
    // Rejeter un commentaire
    static async rejectComment(commentId) {
        return await this.sendRequest('rejectComment', { commentId });
    }
}
