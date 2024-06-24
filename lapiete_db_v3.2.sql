-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 25 juin 2024 à 01:09
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `lapiete`
--

-- --------------------------------------------------------

--
-- Structure de la table `cimetiere`
--

CREATE TABLE `cimetiere` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `nomDeCimetiere` varchar(255) DEFAULT NULL,
  `adresseDeCimetiere` varchar(255) DEFAULT NULL,
  `dateDeCeremonie` date DEFAULT NULL,
  `heureDeCeremonie` varchar(255) DEFAULT NULL,
  `codePostalDeCimetiere` int(255) DEFAULT NULL,
  `villeDeCimetiere` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `concession`
--

CREATE TABLE `concession` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `isConceDeci` tinyint(1) DEFAULT NULL,
  `civiliteDeConcessionaire` varchar(255) DEFAULT NULL,
  `nomDeConcessionaire` varchar(255) DEFAULT NULL,
  `prenomDeConcessionaire` varchar(255) DEFAULT NULL,
  `adresseDeConcessionaire` varchar(255) DEFAULT NULL,
  `lienDeParenteDeConcessionaire` varchar(255) DEFAULT NULL,
  `dateAchatDeConcession` date DEFAULT NULL,
  `dureeDeConcession` varchar(255) DEFAULT NULL,
  `numeroDeConcession` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `deces`
--

CREATE TABLE `deces` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `decesDate` date DEFAULT NULL,
  `decesDateDeclaration` date DEFAULT NULL,
  `decesHeure` varchar(255) DEFAULT NULL,
  `decesLieu` varchar(255) DEFAULT NULL,
  `decesNomEtablissement` varchar(255) DEFAULT NULL,
  `decesAdresseLieuDeces` varchar(255) DEFAULT NULL,
  `decesVille` varchar(255) DEFAULT NULL,
  `decesDepartementDeces` varchar(255) DEFAULT NULL,
  `decesCodePostal` int(255) DEFAULT NULL,
  `decesTelephone` varchar(255) DEFAULT NULL,
  `decesFax` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `decisionnaire`
--

CREATE TABLE `decisionnaire` (
  `numeroDefunt` int(11) NOT NULL,
  `numeroDecisionnaire` int(11) NOT NULL,
  `decisionnaireCivilite` varchar(255) DEFAULT NULL,
  `decisionnaireNom` varchar(255) DEFAULT NULL,
  `decisionnairePrenom` varchar(255) DEFAULT NULL,
  `decisionnaireNomJeuneFille` varchar(255) DEFAULT NULL,
  `decisionnaireDateNaissance` date DEFAULT NULL,
  `decisionnaireLieuNaissance` varchar(255) DEFAULT NULL,
  `decisionnaireAdresse` varchar(255) DEFAULT NULL,
  `decisionnaireCodePostal` int(11) DEFAULT NULL,
  `decisionnaireVille` varchar(255) DEFAULT NULL,
  `decisionnaireEmail` varchar(255) DEFAULT NULL,
  `decisionnaireTelephone` varchar(255) DEFAULT NULL,
  `decisionnaireLienParente` varchar(255) DEFAULT NULL,
  `decisionnaireProfession` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `defunt`
--

CREATE TABLE `defunt` (
  `numeroDefunt` int(11) NOT NULL,
  `defuntCivilite` varchar(255) DEFAULT NULL,
  `defuntNom` varchar(255) DEFAULT NULL,
  `defuntPrenom` varchar(255) DEFAULT NULL,
  `defuntNomJeuneFille` varchar(255) DEFAULT NULL,
  `defuntDateDeNaissance` date DEFAULT NULL,
  `defuntLieuDeNaissance` varchar(255) DEFAULT NULL,
  `defuntAdresse` varchar(255) DEFAULT NULL,
  `defuntCodePostal` int(255) DEFAULT NULL,
  `defuntVille` varchar(255) DEFAULT NULL,
  `defuntNationalite` varchar(255) DEFAULT NULL,
  `defuntProfession` varchar(255) DEFAULT NULL,
  `defuntNombreEnfants` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `numeroDossier` varchar(250) DEFAULT NULL,
  `numeroAssurance` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `filiation`
--

CREATE TABLE `filiation` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `filiationNomPere` varchar(255) DEFAULT NULL,
  `filiationPrenomPere` varchar(255) DEFAULT NULL,
  `filiationDateLieuNaissancePere` varchar(255) DEFAULT NULL,
  `filiationDateLieuDecesPere` varchar(255) DEFAULT NULL,
  `filiationAdressePere` varchar(255) DEFAULT NULL,
  `filiationProfessionPere` varchar(255) DEFAULT NULL,
  `filiationNomMere` varchar(255) DEFAULT NULL,
  `filiationPrenomMere` varchar(255) DEFAULT NULL,
  `filiationDateLieuNaissanceMere` varchar(255) DEFAULT NULL,
  `filiationDateLieuDecesMere` varchar(255) DEFAULT NULL,
  `filiationAdresseMere` varchar(255) DEFAULT NULL,
  `filiationProfessionMere` varchar(255) DEFAULT NULL,
  `filiationIsFatherAlive` tinyint(1) NOT NULL,
  `filiationIsMotherAlive` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `generated_documents`
--

CREATE TABLE `generated_documents` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `page_garde_garde` mediumblob DEFAULT NULL,
  `demande_prefecture` mediumblob DEFAULT NULL,
  `demande_consulaire` mediumblob DEFAULT NULL,
  `deroulement_rap` mediumblob DEFAULT NULL,
  `deroulement_inh` mediumblob DEFAULT NULL,
  `tm_apres_mb` mediumblob DEFAULT NULL,
  `tm_avant_mb` mediumblob DEFAULT NULL,
  `page_condoleance` mediumblob DEFAULT NULL,
  `demande_d_inhumation` mediumblob DEFAULT NULL,
  `bon_de_travaux` mediumblob DEFAULT NULL,
  `achat_de_concession` mediumblob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `mise_en_biere`
--

CREATE TABLE `mise_en_biere` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `miseEnBiereLieu` varchar(255) DEFAULT NULL,
  `miseEnBiereDate` date DEFAULT NULL,
  `miseEnBiereHeure` varchar(255) DEFAULT NULL,
  `miseEnBiereToiletteDate` date DEFAULT NULL,
  `miseEnBiereToiletteLieu` varchar(255) DEFAULT NULL,
  `miseEnBiereToiletteHeure` varchar(255) DEFAULT NULL,
  `miseEnBiereLeveeDate` date DEFAULT NULL,
  `miseEnBiereLeveeHeure` varchar(255) DEFAULT NULL,
  `miseEnBiereDestination` varchar(255) DEFAULT NULL,
  `miseEnBierePassageLieuCulte` tinyint(1) DEFAULT 1,
  `miseEnBiereLieuCulteNom` varchar(255) DEFAULT NULL,
  `miseEnBiereLieuCulteAdresse` varchar(255) DEFAULT NULL,
  `miseEnBierePriereHeure` varchar(255) DEFAULT NULL,
  `miseEnBiereAutorisationDe` varchar(255) DEFAULT NULL,
  `miseEnBiereDateAutorisationFerme` date DEFAULT NULL,
  `isMembreisDec` tinyint(1) DEFAULT NULL,
  `miseEnBierePresenceMembreFamille` tinyint(1) DEFAULT NULL,
  `miseEnBiereMembreFamilleCivilite` varchar(50) DEFAULT NULL,
  `miseEnBiereMembreFamilleNom` varchar(255) DEFAULT NULL,
  `miseEnBiereMembreFamilleLienP` varchar(255) DEFAULT NULL,
  `miseEnBiereMembreFamilleAdress` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `rapatriement`
--

CREATE TABLE `rapatriement` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `rapatriementCodePostal` int(11) DEFAULT NULL,
  `rapatriementVilleDInhumation` varchar(255) DEFAULT NULL,
  `rapatriementPaysDInhumation` varchar(255) DEFAULT NULL,
  `rapatriementAdresseDInhumation` varchar(255) DEFAULT NULL,
  `rapatriementContactPaysInhumation` varchar(255) DEFAULT NULL,
  `rapatriementPhoneRespoPaysInhumation` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `situation_familiale`
--

CREATE TABLE `situation_familiale` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `situationFamiliale` varchar(255) DEFAULT NULL,
  `situationFamilialeNomMarie` varchar(255) DEFAULT NULL,
  `situationFamilialeNomVeuf` varchar(255) DEFAULT NULL,
  `situationFamilialeNomDivorce` varchar(255) DEFAULT NULL,
  `situationFamilialeNomPacse` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `societe`
--

CREATE TABLE `societe` (
  `id` int(11) NOT NULL,
  `societeNumeroPF` int(11) DEFAULT NULL,
  `societeNomPF` varchar(255) DEFAULT NULL,
  `societeAdresse` varchar(255) DEFAULT NULL,
  `societeCodePostal` varchar(255) DEFAULT NULL,
  `societeVille` varchar(255) DEFAULT NULL,
  `societeStatut` varchar(255) DEFAULT NULL,
  `societeCapital` int(11) DEFAULT NULL,
  `societeNumeroHabilitation` varchar(255) DEFAULT NULL,
  `societeDateFinHabilitation` date NOT NULL,
  `societeTelephoneFixe` varchar(255) DEFAULT NULL,
  `societeTelephonePortable` varchar(255) DEFAULT NULL,
  `societeFax` varchar(255) DEFAULT NULL,
  `societeEmail` varchar(255) DEFAULT NULL,
  `societeSite` varchar(255) DEFAULT NULL,
  `societeRCS` varchar(255) DEFAULT NULL,
  `societeSIRET` varchar(255) DEFAULT NULL,
  `societeTVA` varchar(255) DEFAULT NULL,
  `societeAPE` varchar(255) DEFAULT NULL,
  `societeLogo` varchar(255) DEFAULT NULL,
  `societeTampon` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `societe`
--

INSERT INTO `societe` (`id`, `societeNumeroPF`, `societeNomPF`, `societeAdresse`, `societeCodePostal`, `societeVille`, `societeStatut`, `societeCapital`, `societeNumeroHabilitation`, `societeDateFinHabilitation`, `societeTelephoneFixe`, `societeTelephonePortable`, `societeFax`, `societeEmail`, `societeSite`, `societeRCS`, `societeSIRET`, `societeTVA`, `societeAPE`, `societeLogo`, `societeTampon`) VALUES
(1, NULL, 'POMPES FUNÈBRES LA PIÉTÉ', '17, Rue de la Santé', '75013', 'PARIS', 'SASU', 10000, '20-75-0507', '2025-10-30', '06 65 22 22 20', '06 65 22 87 25\r\n', '09 81 40 89 51', 'contact@lapiete.com', 'www.lapiete.com', 'RCS PARIS', 'SIRET 889 423 745 000 13', 'TVA FR 00 889 423 745', 'APE 9603Z', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `uploaded_documents`
--

CREATE TABLE `uploaded_documents` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `cni_origin_defunt` mediumblob DEFAULT NULL,
  `cni_fr_defunt` blob DEFAULT NULL,
  `act_naissance` mediumblob DEFAULT NULL,
  `cni_origin_dec` mediumblob DEFAULT NULL,
  `cni_fr_dec` mediumblob DEFAULT NULL,
  `passport1` mediumblob DEFAULT NULL,
  `passport2` mediumblob DEFAULT NULL,
  `certificat_deces` mediumblob DEFAULT NULL,
  `act_deces` mediumblob DEFAULT NULL,
  `fermeture_cercueil` mediumblob DEFAULT NULL,
  `attestation_covid` mediumblob DEFAULT NULL,
  `autorisation_prefecture` mediumblob DEFAULT NULL,
  `autorisation_consulaire` mediumblob DEFAULT NULL,
  `confirmation_vol` mediumblob DEFAULT NULL,
  `pouvoir` mediumblob DEFAULT NULL,
  `declaration_deces` mediumblob DEFAULT NULL,
  `mise_en_biere` mediumblob DEFAULT NULL,
  `attestation_honneur` mediumblob DEFAULT NULL,
  `attestation_accompagnateurs` mediumblob DEFAULT NULL,
  `justification_lien_parente` mediumblob DEFAULT NULL,
  `achat_concession` mediumblob DEFAULT NULL,
  `bon_travaux` mediumblob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `last_login`) VALUES
(1, 'admin', 'Hicham', 'Fen', 'admin@gmail.com', NULL, '$2a$10$HQBd3W48XL4Jo/3OJRHqKefB0P7LS54nkZYwopMnR2Z0n35B1q/62', NULL, '2023-03-17 13:58:16', '2024-06-24 21:41:05');

-- --------------------------------------------------------

--
-- Structure de la table `vol`
--

CREATE TABLE `vol` (
  `numeroDefunt` int(11) DEFAULT NULL,
  `volNumeroLTA` varchar(255) DEFAULT NULL,
  `numeroDeVol` varchar(255) DEFAULT NULL,
  `volDateDepot` date DEFAULT NULL,
  `volDateDepart` date DEFAULT NULL,
  `volDateArrivee` date DEFAULT NULL,
  `volCompagnieAerienne` varchar(255) DEFAULT NULL,
  `aeroportDeDepart` varchar(255) DEFAULT NULL,
  `aeroportDArrivee` varchar(255) DEFAULT NULL,
  `heureDepotAeroport` varchar(255) DEFAULT NULL,
  `volHeureDepart` varchar(255) DEFAULT NULL,
  `volHeureArrivee` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `cimetiere`
--
ALTER TABLE `cimetiere`
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `concession`
--
ALTER TABLE `concession`
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `deces`
--
ALTER TABLE `deces`
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `decisionnaire`
--
ALTER TABLE `decisionnaire`
  ADD PRIMARY KEY (`numeroDecisionnaire`),
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `defunt`
--
ALTER TABLE `defunt`
  ADD PRIMARY KEY (`numeroDefunt`);

--
-- Index pour la table `filiation`
--
ALTER TABLE `filiation`
  ADD KEY `filiation_ibfk_1` (`numeroDefunt`);

--
-- Index pour la table `generated_documents`
--
ALTER TABLE `generated_documents`
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `mise_en_biere`
--
ALTER TABLE `mise_en_biere`
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `rapatriement`
--
ALTER TABLE `rapatriement`
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `situation_familiale`
--
ALTER TABLE `situation_familiale`
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `societe`
--
ALTER TABLE `societe`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `uploaded_documents`
--
ALTER TABLE `uploaded_documents`
  ADD UNIQUE KEY `numeroDefunt_2` (`numeroDefunt`),
  ADD KEY `numeroDefunt` (`numeroDefunt`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `vol`
--
ALTER TABLE `vol`
  ADD KEY `fk_vol_defunt` (`numeroDefunt`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `decisionnaire`
--
ALTER TABLE `decisionnaire`
  MODIFY `numeroDecisionnaire` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `societe`
--
ALTER TABLE `societe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `cimetiere`
--
ALTER TABLE `cimetiere`
  ADD CONSTRAINT `cimetiere_ibfk_1` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `concession`
--
ALTER TABLE `concession`
  ADD CONSTRAINT `concession_ibfk_1` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `deces`
--
ALTER TABLE `deces`
  ADD CONSTRAINT `deces_ibfk_1` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `decisionnaire`
--
ALTER TABLE `decisionnaire`
  ADD CONSTRAINT `decisionnaire_ibfk_1` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `filiation`
--
ALTER TABLE `filiation`
  ADD CONSTRAINT `filiation_ibfk_1` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `generated_documents`
--
ALTER TABLE `generated_documents`
  ADD CONSTRAINT `generated_documents_ibfk_2` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE;

--
-- Contraintes pour la table `mise_en_biere`
--
ALTER TABLE `mise_en_biere`
  ADD CONSTRAINT `mise_en_biere_ibfk_1` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `rapatriement`
--
ALTER TABLE `rapatriement`
  ADD CONSTRAINT `rapatriement_ibfk_1` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `situation_familiale`
--
ALTER TABLE `situation_familiale`
  ADD CONSTRAINT `situation_familiale_ibfk_1` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `uploaded_documents`
--
ALTER TABLE `uploaded_documents`
  ADD CONSTRAINT `uploaded_documents_ibfk_2` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE;

--
-- Contraintes pour la table `vol`
--
ALTER TABLE `vol`
  ADD CONSTRAINT `fk_vol_defunt` FOREIGN KEY (`numeroDefunt`) REFERENCES `defunt` (`numeroDefunt`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
