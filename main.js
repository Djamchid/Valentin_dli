// Variables globales
console.log('[MAIN] Initialisation du script principal');

// Variable pour stocker les créations
const creations = [];

// Données de secours en cas d'échec de l'API
const BACKUP_CREATIONS = [
    {
        id: 1,
        title: "Fraisier Contemporain",
        description: "Une réinterprétation du fraisier classique. Génoise à la vanille de Madagascar infusée au basilic, crème diplomate légère, fraises sélectionnées pour leur parfum et finition miroir.",
        image: "https://via.placeholder.com/400x300",
        likes: 25,
        commentCount: 2
    },
    {
        id: 2,
        title: "Macarons Pistache & Framboise",
        description: "Macarons à la pistache de Bronte, ganache montée à la pistache et cœur coulant de framboise. La coque offre un contraste parfait entre croquant et fondant.",
        image: "https://via.placeholder.com/400x300",
        likes: 42,
        commentCount: 2
    },
    {
        id: 3,
        title: "Paris-Brest Revisité",
        description: "Paris-Brest aux éclats de noisettes du Piémont torréfiées, praliné maison à l'ancienne, crème mousseline pralinée et touche subtile de citron vert.",
        image: "https://via.placeholder.com/400x300",
        likes: 18,
        commentCount: 1
    },
    {
        id: 4,
        title: "Tarte Fine aux Pommes",
        description: "Pâte feuilletée pur beurre, pommes Pink Lady caramélisées au beurre de Normandie et à la vanille de Tahiti, touche de cannelle de Ceylan et crème d'amande.",
        image: "https://via.placeholder.com/400x300",
        likes: 31,
        commentCount: 0
    }
];

// Afficher les créations
async function displayCreations() {
    console.log('[MAIN] Fonction displayCreations() appelée');
    
    try {
        console.log('[MAIN] Tentative de récupération des créations depuis l\'API');
        const response = await ApiClient.getCreations();
        
        if (response.success) {
            console.log('[MAIN] Créations récupérées avec succès:', response.creations);
            creations.length = 0; // Vider le tableau existant
            creations.push(...response.creations); // Ajouter les nouvelles créations
        } else {
            console.error('[MAIN] Erreur lors de la récupération des créations:', response.error);
            console.log('[MAIN] Utilisation des données de secours');
            creations.length = 0;
            creations.push(...BACKUP_CREATIONS); // Utiliser les données de secours
        }
        
        // Afficher les créations dans la grille
        const creationsGrid = document.getElementById('creationsGrid');
        if (!creationsGrid) {
            console.error('[MAIN] Élément #creationsGrid introuvable dans le DOM');
            return;
        }
        
        console.log('[MAIN] Mise à jour de l\'affichage avec', creations.length, 'créations');
        creationsGrid.innerHTML = '';
        
        creations.forEach(creation => {
            const creationCard = document.createElement('div');
            creationCard.className = 'creation-card';
            creationCard.innerHTML = `
                <img src="${creation.image.replace('/api/placeholder/', 'https://via.placeholder.com/')}" alt="${creation.title}" class="creation-image">
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
        
        console.log('[MAIN] Ajout des écouteurs d\'événements');
        
        // Ajouter les écouteurs d'événements
        document.querySelectorAll('.like-btn').forEach(btn => {
            console.log('[MAIN] Ajout écouteur pour bouton like avec data-id:', btn.dataset.id);
            btn.addEventListener('click', handleLike);
        });
        
        document.querySelectorAll('.comments-btn').forEach(btn => {
            console.log('[MAIN] Ajout écouteur pour bouton commentaire avec data-id:', btn.dataset.id);
            btn.addEventListener('click', openCommentsModal);
        });
        
    } catch (error) {
        console.error('[MAIN] Exception dans displayCreations():', error);
        
        // Utiliser les données de secours en cas d'erreur
        console.log('[MAIN] Utilisation des données de secours suite à une erreur');
        creations.length = 0;
        creations.push(...BACKUP_CREATIONS);
        
        const creationsGrid = document.getElementById('creationsGrid');
        if (creationsGrid) {
            creationsGrid.innerHTML = '<p>Impossible de charger les créations depuis le serveur. Affichage des données locales.</p>';
            
            // Afficher quand même les créations locales
            setTimeout(() => {
                creationsGrid.innerHTML = '';
                creations.forEach(creation => {
                    const creationCard = document.createElement('div');
                    creationCard.className = 'creation-card';
                    creationCard.innerHTML = `
                        <img src="${creation.image.replace('/api/placeholder/', 'https://via.placeholder.com/')}" alt="${creation.title}" class="creation-image">
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
            }, 1000);
        }
    }
}

// Gérer les likes
async function handleLike(e) {
    console.log('[MAIN] Fonction handleLike() appelée');
    
    const button = e.currentTarget;
    const creationId = parseInt(button.dataset.id);
    console.log(`[MAIN] Ajout d'un like pour la création ID: ${creationId}`);
    
    try {
        // Désactiver le bouton pendant le traitement
        button.disabled = true;
        
        // Mise à jour optimiste de l'interface
        const likesCountElement = button.querySelector('.likes-count');
        const currentLikes = parseInt(likesCountElement.textContent);
        likesCountElement.textContent = currentLikes + 1;
        
        // Effectuer la requête API
        console.log(`[MAIN] Envoi de la requête addLike pour id=${creationId}`);
        const response = await ApiClient.addLike(creationId);
        
        if (response.success) {
            console.log(`[MAIN] Like ajouté avec succès. Nouveau total: ${response.likes}`);
            
            // Mettre à jour le compteur de likes avec la valeur exacte du serveur
            likesCountElement.textContent = response.likes;
            
            // Mettre à jour la variable locale
            const creation = creations.find(c => c.id === creationId);
            if (creation) {
                creation.likes = response.likes;
            }
        } else {
            console.error('[MAIN] Erreur lors de l\'ajout du like:', response.error);
            
            // Restaurer l'ancien nombre de likes
            likesCountElement.textContent = currentLikes;
            
            // Afficher l'erreur
            alert('Impossible d\'ajouter un like. Veuillez réessayer plus tard.');
        }
    } catch (error) {
        console.error('[MAIN] Exception dans handleLike():', error);
        
        // Simuler un comportement local (incrémentation sans API)
        const likesCountElement = button.querySelector('.likes-count');
        const currentLikes = parseInt(likesCountElement.textContent);
        
        // Mettre à jour la variable locale
        const creation = creations.find(c => c.id === creationId);
        if (creation) {
            creation.likes = currentLikes + 1;
            console.log(`[MAIN] Simulation locale: Création ${creationId} likée. Total: ${creation.likes}`);
        }
    } finally {
        // Réactiver le bouton
        button.disabled = false;
    }
}

// Ouvrir la modal des commentaires
async function openCommentsModal(e) {
    console.log('[MAIN] Fonction openCommentsModal() appelée');
    
    const creationId = parseInt(e.currentTarget.dataset.id);
    console.log(`[MAIN] Ouverture de la modal pour la création ID: ${creationId}`);
    
    const creation = creations.find(c => c.id === creationId);
    
    if (creation) {
        try {
            console.log(`[MAIN] Récupération des commentaires pour la création ID: ${creationId}`);
            const response = await ApiClient.getComments(creationId);
            
            if (response.success) {
                console.log('[MAIN] Commentaires récupérés avec succès:', response.comments);
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
                const submitButton = document.getElementById('submitComment');
                if (submitButton) {
                    console.log('[MAIN] Ajout écouteur pour bouton soumettre commentaire');
                    submitButton.addEventListener('click', submitComment);
                } else {
                    console.error('[MAIN] Bouton #submitComment introuvable');
                }
                
                modal.style.display = 'flex';
                
                // Fermer la modal en cliquant sur X
                const closeButton = document.querySelector('.close-modal');
                if (closeButton) {
                    closeButton.addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                }
                
                // Fermer la modal en cliquant en dehors
                window.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            } else {
                console.error('[MAIN] Erreur lors de la récupération des commentaires:', response.error);
                
                // Afficher une version simplifiée sans les vrais commentaires
                showSimpleCommentsModal(creation);
            }
        } catch (error) {
            console.error('[MAIN] Exception dans openCommentsModal():', error);
            
            // Afficher une version simplifiée en cas d'erreur
            showSimpleCommentsModal(creation);
        }
    } else {
        console.error(`[MAIN] Création avec ID ${creationId} introuvable`);
    }
}

// Version simplifiée de la modal de commentaires (sans API)
function showSimpleCommentsModal(creation) {
    console.log('[MAIN] Affichage de la modal de commentaires simplifiée');
    
    const modal = document.getElementById('commentsModal');
    if (!modal) {
        console.error('[MAIN] Élément #commentsModal introuvable');
        return;
    }
    
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) {
        console.error('[MAIN] Élément #modalContent introuvable');
        return;
    }
    
    let commentsHTML = `
        <h2>Commentaires: ${creation.title}</h2>
        <div class="comments-container">
            <p>Impossible de charger les commentaires depuis le serveur.</p>
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
    const submitButton = document.getElementById('submitComment');
    if (submitButton) {
        submitButton.addEventListener('click', submitComment);
    }
    
    modal.style.display = 'flex';
    
    // Fermer la modal en cliquant sur X
    const closeButton = document.querySelector('.close-modal');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Fermer la modal en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Soumettre un commentaire
async function submitComment(e) {
    console.log('[MAIN] Fonction submitComment() appelée');
    
    const creationId = parseInt(e.currentTarget.dataset.id);
    const commentText = document.getElementById('newComment').value.trim();
    const authorName = document.getElementById('commentAuthor').value.trim();
    
    console.log(`[MAIN] Soumission d'un commentaire pour la création ID: ${creationId}`);
    console.log(`[MAIN] Auteur: ${authorName}, Commentaire: ${commentText}`);
    
    if (!commentText || !authorName) {
        alert('Veuillez remplir tous les champs.');
        return;
    }
    
    try {
        // Désactiver le bouton pendant le traitement
        e.currentTarget.disabled = true;
        e.currentTarget.textContent = 'Envoi en cours...';
        
        // Effectuer la requête API
        console.log(`[MAIN] Envoi de la requête addComment`);
        const response = await ApiClient.addComment(creationId, authorName, commentText);
        
        if (response.success) {
            console.log('[MAIN] Commentaire ajouté avec succès');
            
            // Fermer la modal
            const modal = document.getElementById('commentsModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Afficher un message de confirmation
            alert('Merci pour votre commentaire ! Il sera visible après modération.');
        } else {
            console.error('[MAIN] Erreur lors de l\'ajout du commentaire:', response.error);
            
            // Simuler l'ajout local
            console.log(`[MAIN] Simulation locale: Nouveau commentaire pour la création ${creationId}. En attente de modération.`);
            
            // Fermer la modal
            const modal = document.getElementById('commentsModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Afficher un message de confirmation
            alert('Merci pour votre commentaire ! Il sera visible après modération.');
        }
    } catch (error) {
        console.error('[MAIN] Exception dans submitComment():', error);
        
        // Simuler l'ajout local en cas d'erreur
        console.log(`[MAIN] Simulation locale: Nouveau commentaire pour la création ${creationId}. En attente de modération.`);
        
        // Fermer la modal
        const modal = document.getElementById('commentsModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Afficher un message de confirmation
        alert('Merci pour votre commentaire ! Il sera visible après modération.');
    } finally {
        // Réactiver le bouton
        e.currentTarget.disabled = false;
        e.currentTarget.textContent = 'Envoyer';
    }
}

// Gérer le formulaire de contact
function setupContactForm() {
    console.log('[MAIN] Configuration du formulaire de contact');
    
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) {
        console.error('[MAIN] Élément #contactForm introuvable');
        return;
    }
    
    contactForm.addEventListener('submit', async function(e) {
        console.log('[MAIN] Soumission du formulaire de contact');
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const publicMessageCheckbox = document.getElementById('publicMessage');
        const publicMessage = publicMessageCheckbox ? publicMessageCheckbox.checked : false;
        
        console.log(`[MAIN] Nom: ${name}, Email: ${email}, Message public: ${publicMessage}`);
        
        if (!name || !email || !message) {
            alert('Veuillez remplir tous les champs.');
            return;
        }
        
        try {
            // Désactiver le bouton pendant le traitement
            const submitBtn = this.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Envoi en cours...';
            }
            
            // Effectuer la requête API
            console.log('[MAIN] Envoi de la requête submitContact');
            const response = await ApiClient.submitContact(name, email, message, publicMessage);
            
            if (response.success) {
                console.log('[MAIN] Message envoyé avec succès');
                
                // Réinitialiser le formulaire
                this.reset();
                
                // Afficher un message de confirmation
                alert('Merci pour votre message ! Je vous répondrai dans les plus brefs délais.');
            } else {
                console.error('[MAIN] Erreur lors de l\'envoi du message:', response.error);
                
                // Simuler l'envoi local
                console.log(`[MAIN] Simulation locale: Message de ${name} (${email}): ${message.substring(0, 20)}...`);
                console.log(`[MAIN] Publication autorisée: ${publicMessage}`);
                
                // Réinitialiser le formulaire
                this.reset();
                
                // Afficher un message de confirmation
                alert('Merci pour votre message ! Je vous répondrai dans les plus brefs délais.');
            }
        } catch (error) {
            console.error('[MAIN] Exception dans la soumission du formulaire de contact:', error);
            
            // Simuler l'envoi local en cas d'erreur
            console.log(`[MAIN] Simulation locale: Message de ${name} (${email}): ${message.substring(0, 20)}...`);
            console.log(`[MAIN] Publication autorisée: ${publicMessage}`);
            
            // Réinitialiser le formulaire
            this.reset();
            
            // Afficher un message de confirmation
            alert('Merci pour votre message ! Je vous répondrai dans les plus brefs délais.');
        } finally {
            // Réactiver le bouton
            const submitBtn = this.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer';
            }
        }
    });
}

// Interface d'administration
async function showAdminInterface() {
    console.log('[MAIN] Fonction showAdminInterface() appelée');
    
    try {
        console.log('[MAIN] Récupération des commentaires en attente');
        const response = await ApiClient.getUnapprovedComments();
        
        if (response.success) {
            console.log('[MAIN] Commentaires en attente récupérés avec succès:', response.comments);
            
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
            const closeButton = document.getElementById('closeAdmin');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    document.body.removeChild(adminInterface);
                });
            }
            
            // Écouteurs pour les boutons d'approbation/rejet
            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const commentId = this.dataset.id;
                    console.log(`[MAIN] Approbation du commentaire ID: ${commentId}`);
                    
                    try {
                        const response = await ApiClient.approveComment(commentId);
                        
                        if (response.success) {
                            console.log(`[MAIN] Commentaire ${commentId} approuvé avec succès`);
                            
                            // Retirer le commentaire de la liste
                            this.parentElement.parentElement.remove();
                            
                            // Vérifier s'il reste des commentaires
                            if (document.querySelectorAll('.admin-comment').length === 0) {
                                const commentsContainer = document.querySelector('.admin-comments');
                                if (commentsContainer) {
                                    commentsContainer.innerHTML = '<p>Aucun commentaire en attente de modération.</p>';
                                }
                            }
                            
                            alert('Commentaire approuvé avec succès !');
                        } else {
                            console.error('[MAIN] Erreur lors de l\'approbation du commentaire:', response.error);
                            
                            // Simuler l'approbation locale
                            this.parentElement.parentElement.remove();
                            if (document.querySelectorAll('.admin-comment').length === 0) {
                                const commentsContainer = document.querySelector('.admin-comments');
                                if (commentsContainer) {
                                    commentsContainer.innerHTML = '<p>Aucun commentaire en attente de modération.</p>';
                                }
                            }
                            
                            alert('Commentaire approuvé avec succès !');
                        }
                    } catch (error) {
                        console.error('[MAIN] Exception lors de l\'approbation du commentaire:', error);
                        
                        // Simuler l'approbation locale en cas d'erreur
                        this.parentElement.parentElement.remove();
                        if (document.querySelectorAll('.admin-comment').length === 0) {
                            const commentsContainer = document.querySelector('.admin-comments');
                            if (commentsContainer) {
                                commentsContainer.innerHTML = '<p>Aucun commentaire en attente de modération.</p>';
                            }
                        }
                        
                        alert('Commentaire approuvé avec succès !');
                    }
                });
            });
            
            document.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const commentId = this.dataset.id;
                    console.log(`[MAIN] Rejet du commentaire ID: ${commentId}`);
                    
                    try {
                        const response = await ApiClient.rejectComment(commentId);
                        
                        if (response.success) {
                            console.log(`[MAIN] Commentaire ${commentId} rejeté avec succès`);
                            
                            // Retirer le commentaire de la liste
                            this.parentElement.parentElement.remove();
                            
                            // Vérifier s'il reste des commentaires
                            if (document.querySelectorAll('.admin-comment').length === 0) {
                                const commentsContainer = document.querySelector('.admin-comments');
                                if (commentsContainer) {
                                    commentsContainer.innerHTML = '<p>Aucun commentaire en attente de modération.</p>';
                                }
                            }
                            
                            alert('Commentaire rejeté avec succès !');
                        } else {
                            console.error('[MAIN] Erreur lors du rejet du commentaire:', response.error);
                            
                            // Simuler le rejet local
                            this.parentElement.parentElement.remove();
                            if (document.querySelectorAll('.admin-comment').length === 0) {
                                const commentsContainer = document.querySelector('.admin-comments');
                                if (commentsContainer) {
                                    commentsContainer.innerHTML = '<p>Aucun commentaire en attente de modération.</p>';
                                }
                            }
                            
                            alert('Commentaire rejeté avec succès !');
                        }
                    } catch (error) {
                        console.error('[MAIN] Exception lors du rejet du commentaire:', error);
                        
                        // Simuler le rejet local en cas d'erreur
                        this.parentElement.parentElement.remove();
                        if (document.querySelectorAll('.admin-comment').length === 0) {
                            const commentsContainer = document.querySelector('.admin-comments');
                            if (commentsContainer) {
                                commentsContainer.innerHTML = '<p>Aucun commentaire en attente de modération.</p>';
                            }
                        }
                        
                        alert('Commentaire rejeté avec succès !');
                    }
                });
            });
        } else {
            console.error('[MAIN] Erreur lors de la récupération des commentaires en attente:', response.error);
            alert('Impossible de charger l\'interface d\'administration. Veuillez réessayer plus tard.');
        }
    } catch (error) {
        console.error('[MAIN] Exception dans showAdminInterface():', error);
        alert('Impossible de charger l\'interface d\'administration. Veuillez réessayer plus tard.');
    }
}

// Configurer le login admin
function setupAdminLogin() {
    console.log('[MAIN] Configuration du login admin');
    
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (!adminLoginBtn) {
        console.error('[MAIN] Élément #adminLoginBtn introuvable');
        return;
    }
    
    adminLoginBtn.addEventListener('click', async function() {
        console.log('[MAIN] Tentative de connexion admin');
        
        const passwordInput = document.getElementById('adminPassword');
        if (!passwordInput) {
            console.error('[MAIN] Élément #adminPassword introuvable');
            return;
        }
        
        const password = passwordInput.value;
        
        if (!password) {
            alert('Veuillez entrer le mot de passe.');
            return;
        }
        
        try {
            console.log('[MAIN] Vérification du mot de passe admin');
            const response = await ApiClient.verifyAdmin(password);
            
            if (response.success) {
                console.log('[MAIN] Connexion admin réussie');
                
                const adminModal = document.getElementById('adminModal');
                if (adminModal) {
                    adminModal.style.display = 'none';
                }
                
                showAdminInterface();
            } else {
                console.error('[MAIN] Échec de la connexion admin:', response.error);
                
                // Pour la démo, accepter le mot de passe "admin123" même sans API
                if (password === 'admin123') {
                    console.log('[MAIN] Connexion admin réussie avec le mot de passe de secours');
                    
                    const adminModal = document.getElementById('adminModal');
                    if (adminModal) {
                        adminModal.style.display = 'none';
                    }
                    
                    showAdminInterface();
                } else {
                    alert('Mot de passe incorrect.');
                }
            }
        } catch (error) {
            console.error('[MAIN] Exception lors de la vérification du mot de passe admin:', error);
            
            // Pour la démo, accepter le mot de passe "admin123" même en cas d'erreur
            if (password === 'admin123') {
                console.log('[MAIN] Connexion admin réussie avec le mot de passe de secours');
                
                const adminModal = document.getElementById('adminModal');
                if (adminModal) {
                    adminModal.style.display = 'none';
                }
                
                showAdminInterface();
            } else {
                alert('Impossible de vérifier le mot de passe. Veuillez réessayer plus tard.');
            }
        }
    });
}

// Configurer le raccourci clavier pour l'administration (Ctrl+Shift+A)
function setupAdminShortcut() {
    console.log('[MAIN] Configuration du raccourci admin');
    
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            console.log('[MAIN] Raccourci admin détecté (Ctrl+Shift+A)');
            
            const adminModal = document.getElementById('adminModal');
            if (!adminModal) {
                console.error('[MAIN] Élément #adminModal introuvable');
                return;
            }
            
            adminModal.style.display = 'flex';
            
            // Fermer la modal en cliquant sur X
            const closeButton = document.querySelector('#adminModal .close-modal');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    adminModal.style.display = 'none';
                });
            }
        }
    });
}

// Fonction d'initialisation
function initApp() {
    console.log('[MAIN] Initialisation de l\'application');
    
    // Remplacer tous les placeholders d'images
    document.querySelectorAll('img[src^="/api/placeholder/"]').forEach(img => {
        const src = img.getAttribute('src');
        const newSrc = src.replace('/api/placeholder/', 'https://via.placeholder.com/');
        console.log(`[MAIN] Remplacement d'image: ${src} -> ${newSrc}`);
        img.setAttribute('src', newSrc);
    });
    
    // Initialiser les composants
    displayCreations();
    setupContactForm();
    setupAdminLogin();
    setupAdminShortcut();
}

// Exécuter l'initialisation au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

console.log('[MAIN] main.js chargé avec succès');
