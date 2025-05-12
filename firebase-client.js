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
  // [Garder toutes les méthodes existantes...]

  // Nouvelles méthodes pour l'administration des créations

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
}

console.log('firebase-client.js chargé avec succès');
