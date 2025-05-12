// Variables globales
let creations = [];

// Afficher les créations
async function displayCreations() {
    try {
        const response = await ApiClient.getCreations();
        
        if (response.success) {
            creations = response.creations;
            
            const creationsGrid = document.getElementById('creationsGrid');
            creationsGrid.innerHTML = '';
            
            creations.forEach(creation => {
                const creationCard = document.createElement('div');
                creationCard.className = 'creation-card';
                creationCard.innerHTML = `
                    <img src="${creation.image}" alt="${creation.title}" class="creation-image">
                    <div class="creation-details">
                        <h3 class="creation-title">${creation.title}</h3>
                        <p class="creation-description">${creation.description}</p>
                        <div class="creation-interactions">
                            <button class="like-btn" data-id="${creation.id}">
                                <i class="fas fa-heart"></i> <span class="likes-count">${creation.likes}</span>
                            </button>
                            <button class="comments-btn" data-id="${creation.id}">
                                <i class="fas fa-comment"></i> <span class="comments-count">${creation.commentCount || 0}</span>
                            </button>
                        </div>
                    </div>
                `;
                
                creationsGrid.appendChild(creationCard);
            });
            
            // Ajouter les écouteurs d'événements
            document.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', handleLike);
            });
            
            document.querySelectorAll('.comments-btn').forEach(btn => {
                btn.addEventListener('click', openCommentsModal);
            });
        } else {
            console.error('Erreur lors de la récupération des créations:', response.error);
            document.getElementById('creationsGrid').innerHTML = '<p>Impossible de charger les créations. Veuillez réessayer plus tard.</p>';
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('creationsGrid').innerHTML = '<p>Impossible de charger les créations. Veuillez réessayer plus tard.</p>';
    }
}

// Gérer les likes
async function handleLike(e) {
    const button = e.currentTarget;
    const creationId = parseInt(button.dataset.id);
    
    try {
        // Désactiver le bouton pendant le traitement
        button.disabled = true;
        
        const response = await ApiClient.addLike(creationId);
        
        if (response.success) {
            // Mettre à jour le compteur de likes
            button.querySelector('.likes-count').textContent = response.likes;
            
            // Mettre à jour la variable locale
            const creation = creations.find(c => c.id === creationId);
            if (creation) {
                creation.likes = response.likes;
            }
        } else {
            console.error('Erreur lors de l\'ajout du like:', response.error);
            alert('Impossible d\'ajouter un like. Veuillez réessayer plus tard.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible d\'ajouter un like. Veuillez réessayer plus tard.');
    } finally {
        // Réactiver le bouton
        button.disabled = false;
    }
}

// Ouvrir la modal des commentaires
async function openCommentsModal(e) {
    const creationId = parseInt(e.currentTarget.dataset.id);
    const creation = creations.find(c => c.id === creationId);
    
    if (creation) {
        try {
            const response = await ApiClient.getComments(creationId);
            
            if (response.success) {
                const modal = document.getElementById('commentsModal');
                const modalContent = document.getElementById('modalContent');
                const comments = response.comments;
                
                let commentsHTML = `
                    <h2>Commentaires: ${creation.title}</h2>
                    <div class="comments-container">
                `;
                
                if (comments.length > 0) {
                    comments.forEach(comment => {
                        commentsHTML += `
                            <div class="comment">
                                <div class="comment-author">${comment.author}</div>
                                <div class="comment-content">${comment.content}</div>
                            </div>
                        `;
                    });
                } else {
                    commentsHTML += `<p>Aucun commentaire pour le moment.</p>`;
                }
                
                commentsHTML += `
                    </div>
                    <div class="add-comment">
                        <h3>Ajouter un commentaire</h3>
                        <textarea id="newComment" placeholder="Votre commentaire"></textarea>
                        <input type="text" id="commentAuthor" placeholder="Votre nom">
                        <button id="submitComment" data-id="${creation.id}">Envoyer</button>
                        <p><small>Note: Les commentaires sont soumis à modération avant publication.</small></p>
                    </div>
                `;
                
                modalContent.innerHTML = commentsHTML;
                
                // Ajouter l'écouteur d'événement pour soumettre un commentaire
                document.getElementById('submitComment').addEventListener('click', submitComment);
                
                modal.style.display = 'flex';
                
                // Fermer la modal en cliquant sur X
                document.querySelector('.close-modal').addEventListener('click', () => {
                    modal.style.display = 'none';
                });
                
                // Fermer la modal en cliquant en dehors
                window.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            } else {
                console.error('Erreur lors de la récupération des commentaires:', response.error);
                alert('Impossible de charger les commentaires. Veuillez réessayer plus tard.');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les commentaires. Veuillez réessayer plus tard.');
        }
    }
}

// Soumettre un commentaire
async function submitComment(e) {
    const creationId = parseInt(e.currentTarget.dataset.id);
    const commentText = document.getElementById('newComment').value.trim();
    const authorName = document.getElementById('commentAuthor').value.trim();
    
    if (commentText && authorName) {
        try {
            // Désactiver le bouton pendant le traitement
            e.currentTarget.disabled = true;
            
            const response = await ApiClient.addComment(creationId, authorName, commentText);
            
            if (response.success) {
                // Fermer la modal
                document.getElementById('commentsModal').style.display = 'none';
                
                // Afficher un message de confirmation
                alert('Merci pour votre commentaire ! Il sera visible après modération.');
            } else {
                console.error('Erreur lors de l\'ajout du commentaire:', response.error);
                alert('Impossible d\'ajouter le commentaire. Veuillez réessayer plus tard.');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible d\'ajouter le commentaire. Veuillez réessayer plus tard.');
        } finally {
            // Réactiver le bouton
            e.currentTarget.disabled = false;
        }
    } else {
        alert('Veuillez remplir tous les champs.');
    }
}

// Gérer le formulaire de contact
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const publicMessage = document.getElementById('publicMessage').checked;
    
    if (name && email && message) {
        try {
            // Désactiver le bouton pendant le traitement
            const submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';
            
            const response = await ApiClient.submitContact(name, email, message, publicMessage);
            
            if (response.success) {
                // Réinitialiser le formulaire
                this.reset();
                
                // Afficher un message de confirmation
                alert('Merci pour votre message ! Je vous répondrai dans les plus brefs délais.');
            } else {
                console.error('Erreur lors de l\'envoi du message:', response.error);
                alert('Impossible d\'envoyer le message. Veuillez réessayer plus tard.');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible d\'envoyer le message. Veuillez réessayer plus tard.');
        } finally {
            // Réactiver le bouton
            const submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer';
        }
    } else {
        alert('Veuillez remplir tous les champs.');
    }
});

// Interface d'administration
async function showAdminInterface() {
    try {
        const response = await ApiClient.getUnapprovedComments();
        
        if (response.success) {
            // Créer une interface d'administration simplifiée
            const adminInterface = document.createElement('div');
            adminInterface.className = 'admin-interface';
            adminInterface.style.position = 'fixed';
            adminInterface.style.top = '50%';
            adminInterface.style.left = '50%';
            adminInterface.style.transform = 'translate(-50%, -50%)';
            adminInterface.style.backgroundColor = 'white';
            adminInterface.style.padding = '2rem';
            adminInterface.style.borderRadius = '10px';
            adminInterface.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            adminInterface.style.zIndex = '2000';
            adminInterface.style.maxWidth = '800px';
            adminInterface.style.width = '90%';
            adminInterface.style.maxHeight = '80vh';
            adminInterface.style.overflow = 'auto';
            
            let adminContent = `
                <h2 style="margin-bottom: 1.5rem;">Interface d'administration</h2>
                <button id="closeAdmin" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h3>Commentaires en attente de modération</h3>
            `;
            
            const comments = response.comments;
            
            if (comments.length > 0) {
                adminContent += `<div class="admin-comments">`;
                
                comments.forEach(comment => {
                    adminContent += `
                        <div class="admin-comment" style="margin-bottom: 1rem; padding: 1rem; background-color: #f9f9f9; border-radius: 5px;">
                            <p><strong>Création ID:</strong> ${comment.creationId}</p>
                            <p><strong>Auteur:</strong> ${comment.author}</p>
                            <p><strong>Commentaire:</strong> ${comment.content}</p>
                            <div style="margin-top: 0.5rem;">
                                <button class="approve-btn" data-id="${comment.commentId}" style="background-color: #4CAF50; color: white; border: none; padding: 0.5rem 1rem; margin-right: 0.5rem; cursor: pointer;">Approuver</button>
                                <button class="reject-btn" data-id="${comment.commentId}" style="background-color: #f44336; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer;">Rejeter</button>
                            </div>
                        </div>
                    `;
                });
                
                adminContent += `</div>`;
            } else {
                adminContent += `<p>Aucun commentaire en attente de modération.</p>`;
            }
            
            adminInterface.innerHTML = adminContent;
            
            // Ajouter l'interface au document
            document.body.appendChild(adminInterface);
            
            // Ajouter les écouteurs d'événements
            document.getElementById('closeAdmin').addEventListener('click', () => {
                document.body.removeChild(adminInterface);
            });
            
            // Écouteurs pour les boutons d'approbation/rejet
            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const commentId = this.dataset.id;
                    try {
                        const response = await ApiClient.approveComment(commentId);
                        
                        if (response.success) {
                            // Retirer le commentaire de la liste
                            this.parentElement.parentElement.remove();
                            
                            // Vérifier s'il reste des commentaires
                            if (document.querySelectorAll('.admin-comment').length === 0) {
                                document.querySelector('.admin-comments').innerHTML = '<p>Aucun commentaire en attente de modération.</p>';
                            }
                            
                            alert('Commentaire approuvé avec succès !');
                        } else {
                            console.error('Erreur lors de l\'approbation du commentaire:', response.error);
                            alert('Impossible d\'approuver le commentaire. Veuillez réessayer plus tard.');
                        }
                    } catch (error) {
                        console.error('Erreur:', error);
                        alert('Impossible d\'approuver le commentaire. Veuillez réessayer plus tard.');
                    }
                });
            });
            
            document.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const commentId = this.dataset.id;
                    try {
                        const response = await ApiClient.rejectComment(commentId);
                        
                        if (response.success) {
                            // Retirer le commentaire de la liste
                            this.parentElement.parentElement.remove();
                            
                            // Vérifier s'il reste des commentaires
                            if (document.querySelectorAll('.admin-comment').length === 0) {
                                document.querySelector('.admin-comments').innerHTML = '<p>Aucun commentaire en attente de modération.</p>';
                            }
                            
                            alert('Commentaire rejeté avec succès !');
                        } else {
                            console.error('Erreur lors du rejet du commentaire:', response.error);
                            alert('Impossible de rejeter le commentaire. Veuillez réessayer plus tard.');
                        }
                    } catch (error) {
                        console.error('Erreur:', error);
                        alert('Impossible de rejeter le commentaire. Veuillez réessayer plus tard.');
                    }
                });
            });
        } else {
            console.error('Erreur lors de la récupération des commentaires en attente:', response.error);
            alert('Impossible de charger l\'interface d\'administration. Veuillez réessayer plus tard.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de charger l\'interface d\'administration. Veuillez réessayer plus tard.');
    }
}

// Connexion admin
document.getElementById('adminLoginBtn').addEventListener('click', async function() {
    const password = document.getElementById('adminPassword').value;
    
    if (password) {
        try {
            const response = await ApiClient.verifyAdmin(password);
            
            if (response.success) {
                document.getElementById('adminModal').style.display = 'none';
                showAdminInterface();
            } else {
                alert('Mot de passe incorrect.');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de vérifier le mot de passe. Veuillez réessayer plus tard.');
        }
    } else {
        alert('Veuillez entrer le mot de passe.');
    }
});

// Raccourci clavier pour l'administration (Ctrl+Shift+A)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        document.getElementById('adminModal').style.display = 'flex';
        
        // Fermer la modal en cliquant sur X
        document.querySelector('#adminModal .close-modal').addEventListener('click', () => {
            document.getElementById('adminModal').style.display = 'none';
        });
    }
});

// Initialiser l'affichage des créations au chargement de la page
window.onload = function() {
    displayCreations();
};
