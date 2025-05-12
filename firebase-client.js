// firebase-client.js
console.log('Chargement de firebase-client.js');

// Configuration Firebase (À REMPLACER avec vos propres valeurs)
const firebaseConfig = {
  apiKey: "AIzaSyAMl9aeQUk82_Z55mc00HQhicp62z0UnLU",
  authDomain: "valentin-dalili-patisserie.firebaseapp.com",
  projectId: "valentin-dalili-patisserie",
  storageBucket: "valentin-dalili-patisserie.firebasestorage.app",
  messagingSenderId: "882165140149",
  appId: "1:882165140149:web:dc01dc7264bff9c8b1ccfc",
  measurementId: "G-B9QBTXTK6H"
};
// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

console.log('Firebase initialisé avec succès');

// Classe pour gérer les appels API via Firebase
class ApiClient {
  // Récupérer toutes les créations
  static async getCreations() {
    console.log('[API] Appel de getCreations()');
    try {
      const creationsSnapshot = await db.collection("creations").get();
      const creationsList = creationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          image: data.image,
          likes: data.likes || 0,
          commentCount: data.commentCount || 0
        };
      });
      return { success: true, creations: creationsList };
    } catch (error) {
      console.error('[API] Erreur lors de la récupération des créations:', error);
      return { success: false, error: error.toString() };
    }
  }
  
  // Ajouter un like à une création
  static async addLike(creationId) {
    console.log(`[API] Appel de addLike() pour creationId: ${creationId}`);
    try {
      const creationRef = db.collection("creations").doc(creationId);
      await creationRef.update({
        likes: firebase.firestore.FieldValue.increment(1)
      });
      
      // Récupérer le nombre mis à jour de likes
      const updatedDoc = await creationRef.get();
      return { success: true, likes: updatedDoc.data().likes };
    } catch (error) {
      console.error('[API] Erreur lors de l\'ajout d\'un like:', error);
      return { success: false, error: error.toString() };
    }
  }
  
  // Récupérer les commentaires d'une création
  static async getComments(creationId) {
    console.log(`[API] Appel de getComments() pour creationId: ${creationId}`);
    try {
      const commentsSnapshot = await db.collection("comments")
        .where("creationId", "==", creationId)
        .where("approved", "==", true)
        .get();
      
      const commentsList = commentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          commentId: doc.id,
          author: data.author,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      });
      
      return { success: true, comments: commentsList };
    } catch (error) {
      console.error('[API] Erreur lors de la récupération des commentaires:', error);
      return { success: false, error: error.toString() };
    }
  }
  
  // Ajouter un commentaire
  static async addComment(creationId, author, content) {
    console.log(`[API] Appel de addComment() pour creationId: ${creationId}`);
    try {
      // Ajouter le commentaire (non approuvé par défaut)
      await db.collection("comments").add({
        creationId,
        author,
        content,
        approved: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('[API] Erreur lors de l\'ajout d\'un commentaire:', error);
      return { success: false, error: error.toString() };
    }
  }
  
  // Soumettre un message de contact
  static async submitContact(name, email, message, publicMessage) {
    console.log(`[API] Appel de submitContact() pour ${name}`);
    try {
      await db.collection("contacts").add({
        name,
        email,
        message,
        publicMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('[API] Erreur lors de la soumission du formulaire de contact:', error);
      return { success: false, error: error.toString() };
    }
  }
  
  // Vérifier les identifiants admin
  static async verifyAdmin(email, password) {
    console.log('[API] Appel de verifyAdmin()');
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('[API] Erreur lors de la vérification admin:', error);
      return { success: false, error: error.toString() };
    }
  }
  
  // Se déconnecter
  static async logoutAdmin() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.toString() };
    }
  }
  
  // Récupérer les commentaires non approuvés (admin)
  static async getUnapprovedComments() {
    console.log('[API] Appel de getUnapprovedComments()');
    try {
      // Vérifier si l'admin est connecté
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }
      
      const commentsSnapshot = await db.collection("comments")
        .where("approved", "==", false)
        .get();
      
      const commentsList = commentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          commentId: doc.id,
          creationId: data.creationId,
          author: data.author,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      });
      
      return { success: true, comments: commentsList };
    } catch (error) {
      console.error('[API] Erreur lors de la récupération des commentaires non approuvés:', error);
      return { success: false, error: error.toString() };
    }
  }
  
  // Approuver un commentaire
  static async approveComment(commentId) {
    console.log(`[API] Appel de approveComment() pour commentId: ${commentId}`);
    try {
      // Vérifier si l'admin est connecté
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }
      
      const commentRef = db.collection("comments").doc(commentId);
      const commentSnap = await commentRef.get();
      
      if (!commentSnap.exists) {
        return { success: false, error: 'Commentaire non trouvé' };
      }
      
      const commentData = commentSnap.data();
      
      // Transaction pour s'assurer que l'incrémentation du compteur de commentaires est atomique
      await db.runTransaction(async (transaction) => {
        // Approuver le commentaire
        transaction.update(commentRef, { approved: true });
        
        // Incrémenter le compteur de commentaires de la création
        const creationRef = db.collection("creations").doc(commentData.creationId);
        transaction.update(creationRef, {
          commentCount: firebase.firestore.FieldValue.increment(1)
        });
      });
      
      return { success: true };
    } catch (error) {
      console.error('[API] Erreur lors de l\'approbation du commentaire:', error);
      return { success: false, error: error.toString() };
    }
  }
  
  // Rejeter un commentaire
  static async rejectComment(commentId) {
    console.log(`[API] Appel de rejectComment() pour commentId: ${commentId}`);
    try {
      // Vérifier si l'admin est connecté
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }
      
      await db.collection("comments").doc(commentId).delete();
      
      return { success: true };
    } catch (error) {
      console.error('[API] Erreur lors du rejet du commentaire:', error);
      return { success: false, error: error.toString() };
    }
  }
}

console.log('firebase-client.js chargé avec succès');
