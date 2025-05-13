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
const storage = firebase.storage();

console.log('Firebase initialisé avec succès');

// Classe pour gérer les appels API via Firebase
class ApiClient {
  // Méthodes pour la gestion des utilisateurs et l'authentification admin
  static async loginAdmin(email, password) {
    console.log(`[API] Appel de loginAdmin() pour email: ${email}`);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      return { success: true, user: { uid: user.uid, email: user.email } };
    } catch (error) {
      console.error('[API] Erreur de connexion admin:', error);
      return { success: false, error: error.toString() };
    }
  }

  static async logoutAdmin() {
    console.log('[API] Appel de logoutAdmin()');
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('[API] Erreur de déconnexion admin:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Méthodes pour la gestion des créations
  static async getCreations() {
    console.log('[API] Appel de getCreations()');
    try {
      const creationsSnapshot = await db.collection("creations")
        .orderBy("timestamp", "desc")
        .get();

      const creationsList = creationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          image: data.image,
          likes: data.likes || 0,
          commentCount: data.commentCount || 0,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      });

      return { success: true, creations: creationsList };
    } catch (error) {
      console.error('[API] Erreur lors de la récupération des créations:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Ajouter une nouvelle création
  static async addCreation(title, description, imageFile) {
    console.log('[API] Appel de addCreation()');
    try {
      // Vérifier si l'admin est connecté
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }

      // 1. Upload de l'image
      const imageRef = storage.ref().child(`creations/${Date.now()}_${imageFile.name}`);
      const uploadTask = await imageRef.put(imageFile);
      const imageUrl = await uploadTask.ref.getDownloadURL();

      // 2. Création du document dans Firestore
      const creationRef = await db.collection("creations").add({
        title,
        description,
        image: imageUrl,
        likes: 0,
        commentCount: 0,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { 
        success: true, 
        creation: {
          id: creationRef.id,
          title,
          description,
          image: imageUrl,
          likes: 0,
          commentCount: 0
        }
      };
    } catch (error) {
      console.error('[API] Erreur lors de l\'ajout de la création:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Supprimer une création
  static async deleteCreation(creationId) {
    console.log(`[API] Appel de deleteCreation() pour creationId: ${creationId}`);
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }

      // 1. Récupérer la création pour avoir l'URL de l'image
      const creationDoc = await db.collection("creations").doc(creationId).get();
      if (!creationDoc.exists) {
        return { success: false, error: 'Création non trouvée' };
      }

      const creationData = creationDoc.data();

      // 2. Supprimer l'image de Storage si elle existe
      if (creationData.image) {
        try {
          const imageRef = storage.refFromURL(creationData.image);
          await imageRef.delete();
        } catch (imageError) {
          console.warn('[API] Erreur lors de la suppression de l\'image:', imageError);
        }
      }

      // 3. Supprimer tous les commentaires associés
      const commentsSnapshot = await db.collection("comments")
        .where("creationId", "==", creationId)
        .get();
      
      const batch = db.batch();
      commentsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 4. Supprimer la création
      batch.delete(db.collection("creations").doc(creationId));
      
      await batch.commit();

      return { success: true };
    } catch (error) {
      console.error('[API] Erreur lors de la suppression de la création:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Modifier une création
  static async updateCreation(creationId, { title, description, imageFile = null }) {
    console.log(`[API] Appel de updateCreation() pour creationId: ${creationId}`);
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;

      // Si une nouvelle image est fournie
      if (imageFile) {
        // 1. Upload de la nouvelle image
        const imageRef = storage.ref().child(`creations/${Date.now()}_${imageFile.name}`);
        const uploadTask = await imageRef.put(imageFile);
        const newImageUrl = await uploadTask.ref.getDownloadURL();
        updateData.image = newImageUrl;

        // 2. Supprimer l'ancienne image
        try {
          const creationDoc = await db.collection("creations").doc(creationId).get();
          const oldImageUrl = creationDoc.data().image;
          if (oldImageUrl) {
            const oldImageRef = storage.refFromURL(oldImageUrl);
            await oldImageRef.delete();
          }
        } catch (error) {
          console.warn('[API] Erreur lors de la suppression de l\'ancienne image:', error);
        }
      }

      // 3. Mettre à jour le document
      await db.collection("creations").doc(creationId).update({
        ...updateData,
        lastModified: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, updates: updateData };
    } catch (error) {
      console.error('[API] Erreur lors de la modification de la création:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Ajouter un like à une création
  static async addLike(creationId) {
    console.log(`[API] Appel de addLike() pour creationId: ${creationId}`);
    try {
      const creationRef = db.collection("creations").doc(creationId);
      
      // Mettre à jour le compteur de likes
      await creationRef.update({
        likes: firebase.firestore.FieldValue.increment(1)
      });
      
      // Récupérer le document mis à jour pour connaître le nouveau nombre de likes
      const updatedDoc = await creationRef.get();
      
      if (!updatedDoc.exists) {
        return { success: false, error: 'Création non trouvée' };
      }
      
      return { success: true, likes: updatedDoc.data().likes };
    } catch (error) {
      console.error('[API] Erreur lors de l\'ajout du like:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Méthodes pour la gestion des commentaires
  
  // Récupérer les commentaires approuvés d'une création
  static async getComments(creationId) {
    console.log(`[API] Appel de getComments() pour creationId: ${creationId}`);
    try {
      const commentsSnapshot = await db.collection("comments")
        .where("creationId", "==", creationId)
        .where("approved", "==", true)
        .orderBy("timestamp", "desc")
        .get();

      const commentsList = commentsSnapshot.docs.map(doc => ({
        commentId: doc.id,
        author: doc.data().author,
        content: doc.data().content,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      return { success: true, comments: commentsList };
    } catch (error) {
      console.error('[API] Erreur lors de la récupération des commentaires:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Ajouter un commentaire (non approuvé par défaut)
  static async addComment(creationId, author, content) {
    console.log(`[API] Appel de addComment() pour creationId: ${creationId}`);
    try {
      // Vérifier si la création existe
      const creationRef = db.collection("creations").doc(creationId);
      const creationDoc = await creationRef.get();
      
      if (!creationDoc.exists) {
        return { success: false, error: 'Création non trouvée' };
      }
      
      // Ajouter le commentaire
      const commentRef = await db.collection("comments").add({
        creationId,
        author,
        content,
        approved: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { 
        success: true, 
        comment: {
          commentId: commentRef.id,
          author,
          content,
          approved: false
        }
      };
    } catch (error) {
      console.error('[API] Erreur lors de l\'ajout du commentaire:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Récupérer les commentaires en attente de modération
  static async getUnapprovedComments() {
    console.log('[API] Appel de getUnapprovedComments()');
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }

      const commentsSnapshot = await db.collection("comments")
        .where("approved", "==", false)
        .orderBy("timestamp", "desc")
        .get();

      const commentsList = commentsSnapshot.docs.map(doc => ({
        commentId: doc.id,
        creationId: doc.data().creationId,
        author: doc.data().author,
        content: doc.data().content,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      return { success: true, comments: commentsList };
    } catch (error) {
      console.error('[API] Erreur lors de la récupération des commentaires en attente:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Récupérer les commentaires approuvés
  static async getApprovedComments() {
    console.log('[API] Appel de getApprovedComments()');
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }

      const commentsSnapshot = await db.collection("comments")
        .where("approved", "==", true)
        .orderBy("timestamp", "desc")
        .get();

      const commentsList = commentsSnapshot.docs.map(doc => ({
        commentId: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      return { success: true, comments: commentsList };
    } catch (error) {
      console.error('[API] Erreur lors de la récupération des commentaires approuvés:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Approuver un commentaire
  static async approveComment(commentId) {
    console.log(`[API] Appel de approveComment() pour commentId: ${commentId}`);
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }

      const commentRef = db.collection("comments").doc(commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        return { success: false, error: 'Commentaire non trouvé' };
      }

      const commentData = commentDoc.data();
      const creationRef = db.collection("creations").doc(commentData.creationId);

      // Utiliser une transaction pour garantir la cohérence des données
      await db.runTransaction(async (transaction) => {
        // Approuver le commentaire
        transaction.update(commentRef, {
          approved: true
        });

        // Incrémenter le compteur de commentaires de la création
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
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }

      const commentRef = db.collection("comments").doc(commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        return { success: false, error: 'Commentaire non trouvé' };
      }

      // Supprimer le commentaire rejeté
      await commentRef.delete();

      return { success: true };
    } catch (error) {
      console.error('[API] Erreur lors du rejet du commentaire:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Supprimer un commentaire approuvé
  static async deleteApprovedComment(commentId) {
    console.log(`[API] Appel de deleteApprovedComment() pour commentId: ${commentId}`);
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Non autorisé' };
      }

      const commentRef = db.collection("comments").doc(commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        return { success: false, error: 'Commentaire non trouvé' };
      }

      const commentData = commentDoc.data();
      
      // Décrémenter le compteur de commentaires de la création
      if (commentData.approved) {
        const creationRef = db.collection("creations").doc(commentData.creationId);
        await db.runTransaction(async (transaction) => {
          transaction.delete(commentRef);
          transaction.update(creationRef, {
            commentCount: firebase.firestore.FieldValue.increment(-1)
          });
        });
      } else {
        await commentRef.delete();
      }

      return { success: true };
    } catch (error) {
      console.error('[API] Erreur lors de la suppression du commentaire:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Méthodes pour le formulaire de contact
  static async submitContact(name, email, message, publicMessage = false) {
    console.log('[API] Appel de submitContact()');
    try {
      await db.collection("contacts").add({
        name,
        email,
        message,
        publicMessage,
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('[API] Erreur lors de l\'envoi du message de contact:', error);
      return { success: false, error: error.toString() };
    }
  }
}

console.log('firebase-client.js chargé avec succès');
