# Sujet type gestion des sinistres assurance - M2 Renforcement Backend (2026)

## **Contexte :**

L’entreprise AssurMoi est une compagnie d’assurance, elle adresse des services d’assurances automobile (responsabilité civile, tout risques, …) à destination de particuliers et de professionnels.

Au quotidien, l’entreprise est confrontée à de forts besoins de gestion : la gestion contractuelle (nouveaux contrats, suivi des contrats, facturation, relation client …), sinistres (accidents de ses assurés, prise en charge des véhicules, expertise, prise en charge financière partielle ou totale, recouvrement auprès des tiers assurés, ...).

Dans le cadre de la digitalisation de ses processus, AssurMoi souhaiterais mettre en place une plateforme numérique dématérialisée dans laquelle elle pourrait assurer le suivi de sa gestion des sinistres.
Le besoin ici, est de fluidifier et centraliser le suivi des sinistres à partir des réclamations/sollicitations de ses assurés.

---

## Votre mission

Vous êtes en mission auprès d’AssurMoi, il vous est demandé de proposer / préconiser une solution applicative (web / mobile), afin de permettre à AssurMoi de proposer un outil a ses collaborateurs en charge de la prise en charge et du suivi des sinistres.

Nous identifierons les notions suivantes dans le processus à digitaliser :

- Le sinistre :
    - Immatriculation du véhicule
    - Nom & Prénom du conducteur
    - Le conducteur est-il l’assuré ? (O/N)
    - Date et heure de l’appel
    - Date et heure de l’accident / sinistre
    - Contexte du sinistre (texte explicatif)
    - Responsabilité engagée de l’assurée (O/N)
        - Si Oui, pourcentage ? (50% ou 100%)
        - Si Non = 0% (automatiquement)
    - Documents à joindre
        - Attestation d’assurance (nécessite une validation du gestionnaire de portefeuille)
        - Carte grise du véhicule
        - Pièce d’identité du conducteur lors du sinistre
    - Validation du sinistre soumise à une validation du gestionnaire de portefeuille.
- Dossier de prise en charge
    
    Dès lors que le sinistre survient et que la demande de sinistre est complète, un dossier de prise en charge est généré, il permet entre autres de pouvoir assurer le suivi de la prise en charge, avec les différents éléments qui le composent tout en assurant une vérification des éléments à chaque étape de traitement et la possibilité de déclencher des alertes / rappels à échéances.
    
    - Numéro de dossier
    - Référence du sinistre d’origine :
        - *Rappel des éléments issus du sinistre*
    - Processus :
        - Dossier initialisé
        - Demande d’expertise en attente de retour (changement manuel)
            - champ à compléter : date d’expertise planifiée
        - Expertise planifiée
            - champ à compléter : date d’expertise effective
        - Expertise réalisée
            - champs : date de retour d’expertise + champ diagnostic (véhicule réparable / véhicule non réparable) + Document : rapport de l’expert pour passer a l’étape suivante
            - Scénario 1 : **véhicule réparable**
                - Intervention à planifier
                    - *(champ : date d’intervention planifiée à compléter pour passer à la suite)*
                - Intervention planifiée, prise en charge du véhicule en attente de planification
                    - (*champ : date de prise en charge planifiée a compléter pour passer à la suite)*
                - Prise en charge du véhicule planifiée
                    - *(champ : date/heure de prise en charge effective à compléter pour passer à la suite)*
                - Prise en charge du véhicule réalisée
                    - *(champ : date/heure de début d’intervention effective à compléter pour passer à la suite)*
                - Intervention en cours sur le véhicule
                    - *(champ : date de fin d’intervention à compléter pour passer à la suite)*
                - Livraison du véhicule, restitution du véhicule à planifier
                    - *(champ : date de restitution planifiée à compléter pour passer à la suite)*
                - Véhicule en cours de restitution
                    - *(champ : date de restitution effective à compléter pour passer à la suite)*
                - Véhicule restitué, en attente de facturation du prestataire
                    - *(champ : date de réception de facture à compléter + document « Facture » à joindre pour passer à la suite)*
                - Facture reçue (déduction faite de l’éventuelle franchise au contrat), en attente de règlement
                    - *(champ : date de règlement a compléter pour passer à la suite)*
                - Règlement réalisé, en attente du délai de garantie *(48h après le règlement avant de pouvoir passer au statut suivant selon cas énoncés ensuite)*
                    - Si responsabilité (dans le sinistre) 100% ⇒ **dossier clos**
                    - Si responsabilité 50% ou 0% :
                        - Refacturation des frais engagés au prorata à l’assurance tiers.
                            - *(champ : facture réglée par l’assurance tiers à cocher pour valider cette étape)*
                        - **puis Dossier clos**
            - Scénario 2 : **véhicule dont le montant de la réparation est supérieur au prix du véhicule à l’argus**
                - Estimation du montant d’indemnisation de l’assuré à faire (déduction faite de l’éventuelle franchise au contrat)
                    - *(champ : estimation d’indemnisation de l’assuré à compléter pour passer à la suite)*
                - Estimation communiquée à l’assurée, en attente de son approbation
                    - *(champ : approbation du client (boolean) a compléter pour passer à la suite)*
                - Estimation d’indemnisation acceptée, prise en charge du véhicule en attente de planification (Demande du RIB de l’assuré)
                    - *(champ : date prévisionnelle de prise en charge du véhicule à compléter + Document « RIB assuré » à joindre)*
                - Prise en charge du véhicule planifiée
                    - *(champ : date de prise en charge effective du véhicule à compléter)*
                - Prise en charge du véhicule réalisée, indemnisation en attente de règlement
                    - *(champ : date d’indemnisation à compléter pour passer à la suite)*
                - Règlement réalisé,
                    - Si responsabilité (sinistre) 100% ⇒ **dossier clos**
                    - Si responsabilité (sinistre) 50% ou 0% :
                    - Refacturation au prorata de l’indemnisation à l’assurance tiers.
                        - *(champ : facture réglée par l’assurance tiers à cocher pour valider cette étape)*

Caractéristiques générales complémentaires de l’application :

- AssurMoi possède **des utilisateurs avec différents rôles** :
    - Administrateur (ont accès à tout)
    - Les gestionnaires de portefeuille (superviseur global des sinistres et de leur prise en charge)
    - Les chargés de suivi (suivi des dossiers)
    - Les chargés de clientèle (constitution du sinistre et enclenchement du dossier)
- Il est nécessaire de fournir a minima une authentification par utilisateur et mot de passe
- Il faudra prévoir un système de réinitialisation de mot de passe utilisateur.
- Au vu de la confidentialité des données et du caractère stratégique de la solution, **il serait préférable de mettre en place une solution d’authentification à 2 étapes** avec validation par SMS / E-mail
- Pour les besoins de validation des indemnités proposés aux assurés, il conviendrait de connecter une **solution de signature électronique** des documents (DocuSign)
    - De préférence, l’assureur étant Français et ses clients aussi, il vous est demandé d’implémenter une solution respectant les règles du RGPD (données en Europe à minima, en France de préférence). Il convient donc d’implémenter la solution la plus adapté à cette contrainte légale.
- Nous devons posséder une **interface d’administration** pour naturellement pouvoir créer les utilisateurs ou leur retirer les accès.
    - Il faudra **prévoir un statut “actif”/”inactif”** sur les utilisateurs et le vérifier à chaque connexion pour pouvoir désactiver les accès d’un collaborateur sans devoir le supprimer pour autant.
- Tout au long des actions sur l’outil (sinistre et dossier de suivi), il faudra **historiser les actions réalisées sur chacun d’eux**, elles seront horodatées sur une table (ou service) tiers.
- L’application mobile associée devra permettre :
    - **Aux Administrateurs**
        - De créer / supprimer / désactiver des utilisateurs
        - De consulter l’ensemble des sinistres selon leurs statuts
        - De consulter l’ensemble des dossiers selon leurs statuts
        - D’intervenir dans un dossier / sinistre pour poursuivre à l’étape où le dossier est arrêté
        - D’approuver les documents soumis à validation et en attente d’approbation
    - **Aux Gestionnaires de portefeuille**
        - De consulter l’ensemble des sinistres selon leurs statuts
        - De consulter l’ensemble des dossiers selon leurs statuts
        - D’intervenir dans un dossier / sinistre pour poursuivre à l’étape où le dossier est arrêté
        - D’approuver les documents soumis à validation et en attente d’approbation
    - **Aux chargés de clientèle**
        - De consulter l’ensemble des sinistres selon leurs statuts
        - D’intervenir dans un sinistre pour poursuivre à l’étape où le dossier est arrêté
    - **Aux chargés de suivi**
        - De consulter l’ensemble des dossiers selon leurs statuts
        - D’intervenir dans un dossier pour poursuivre à l’étape où le dossier est arrêté
    - **Aux assurés**
        - de se connecter et d’observer les statuts de leurs sinistres / dossiers en cours.
        - Ils pourront déposer des documents ou informations le cas échéant sur les étapes les concernant. (RIB client)
        - Une notification doit leur permettre de savoir qu’une action est en attente de leur part (notification push ET mail).

## Besoins exprimés en “User Story”

- Je suis Administrateur
    - Je dois pouvoir accéder à toutes les fonctionnalités des autres utilisateurs
    - Je peux créer des utilisateurs et leur affecter le bon rôle
- Je suis gestionnaire de portefeuille
    - Je dois pouvoir consulter l’ensemble des sinistres et dossiers,
    - Je dois pouvoir valider les différents documents soumis à validation dans les dossiers/sinistres
    - Je peux changer faire progresser un dossier selon ses étapes et procédés comme un chargé de suivi
    - Je peux créer un sinistre comme un chargé de clientèle.
- Je suis chargé de suivi de dossier
    - Je dois pouvoir prendre en charge un dossier généré
    - Je dois pouvoir progresser selon les étapes du dossiers pour compléter à chaque étape les informations nécessaires pour faire passer le dossier à l’étape suivante
    - Lorsqu’une étape nécessite une approbation d’un gestionnaire, je ne peux pas faire avancer le processus sans sa validation
    - Je suis notifié sous délais indiqué dans le processus.
- Je suis chargé de clientèle
    - Je peux créer un nouveau sinistre
    - Je peux actualiser le sinistre selon chacune de ses étapes pour le mener au bout de sa complétion.
    - Je peux reprendre un sinistre que j’aurais entamé par le passé.
    - Je suis notifié sous délais indiqué lorsqu’un sinistre nécessite d’être repris


### **Livrables attendu 25/03/2026 - fin de journée :**

1. Créer le **contrat d’interface / Swagger** de l’application sur Postman (ou équivalent) *(infos et format ici : https://swagger.io/)*


- **Liste des éléments à construire pour la création d’une route API :**
    - [ ]  Création des routes dans un fichier propre à mon entité `src/routes/XXX.js`
    - [ ]  Importation des routes de mon entité à la racine du routeur API (`src/routes/index.js`), raccorder chaque route à une méthode de service.

        
    - [ ]  Création du fichier de service associé à mon entité dans `src/services/XXX.js`



