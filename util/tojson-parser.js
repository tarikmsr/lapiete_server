const saveLogs = require('../util/logger');
module.exports = async (request,defuntID) => {
  return new Promise((resolve, reject) => {
    try {

      let rows = request;
      const defunt = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        defuntCivilite: rows[0]['defuntCivilite'] ?? null,
        defuntNom: rows[0]['defuntNom'] ?? null,
        defuntPrenom: rows[0]['defuntPrenom'] ?? null,
        defuntNomJeuneFille: rows[0]['defuntNomJeuneFille'] ?? null,
        defuntDateDeNaissance: rows[0]['defuntDateDeNaissance'] == null ? null : new Date(rows[0]['defuntDateDeNaissance']),
        defuntLieuDeNaissance: rows[0]['defuntLieuDeNaissance'] ?? null,
        defuntAdresse: rows[0]['defuntAdresse'] ?? null,
        defuntCodePostal: rows[0]['defuntCodePostal'] ?? null,
        defuntVille: rows[0]['defuntVille'] ?? null,
        defuntNationalite: rows[0]['defuntNationalite'] ?? null,
        defuntProfession: rows[0]['defuntProfession'] ?? null,
        defuntNombreEnfants: rows[0]['defuntNombreEnfants'] ?? null,
        created_at: rows[0]['created_at'] ?? null,

        numeroDossier: rows[0]['numeroDossier'] ?? null,
        numeroAssurance: rows[0]['numeroAssurance'] ?? null,


      };

      const decisionnaire = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        numeroDecisionnaire: rows[0]['numeroDecisionnaire'] ?? null,
        decisionnaireCivilite: rows[0]['decisionnaireCivilite'] ?? null,
        decisionnaireNom: rows[0]['decisionnaireNom'] ?? null,
        decisionnairePrenom: rows[0]['decisionnairePrenom'] ?? null,
        decisionnaireNomJeuneFille: rows[0]['decisionnaireNomJeuneFille'] ?? null,
        decisionnaireDateNaissance: rows[0]['decisionnaireDateNaissance'] == null ? null : new Date(rows[0]['decisionnaireDateNaissance']),
        decisionnaireLieuNaissance: rows[0]['decisionnaireLieuNaissance'] ?? null,
        decisionnaireAdresse: rows[0]['decisionnaireAdresse'] ?? null,
        decisionnaireCodePostal: rows[0]['decisionnaireCodePostal'] ?? null,
        decisionnaireVille: rows[0]['decisionnaireVille'] ?? null,
        decisionnaireEmail: rows[0]['decisionnaireEmail'] ?? null,
        decisionnaireTelephone: rows[0]['decisionnaireTelephone'] ?? null,
        decisionnaireLienParente: rows[0]['decisionnaireLienParente'] ?? null,
        decisionnaireProfession: rows[0]['decisionnaireProfession'] ?? null
      };

      const filiation = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        filiationNomPere: rows[0]['filiationNomPere'] ?? null,
        filiationPrenomPere: rows[0]['filiationPrenomPere'] ?? null,
        filiationDateLieuNaissancePere: rows[0]['filiationDateLieuNaissancePere'] ?? null,
        filiationDateLieuDecesPere: rows[0]['filiationDateLieuDecesPere'] ?? null,
        filiationAdressePere: rows[0]['filiationAdressePere'] ?? null,
        filiationProfessionPere: rows[0]['filiationProfessionPere'] ?? null,
        filiationNomMere: rows[0]['filiationNomMere'] ?? null,
        filiationPrenomMere: rows[0]['filiationPrenomMere'] ?? null,
        filiationDateLieuNaissanceMere: rows[0]['filiationDateLieuNaissanceMere'] ?? null,
        filiationDateLieuDecesMere: rows[0]['filiationDateLieuDecesMere'] ?? null,
        filiationAdresseMere: rows[0]['filiationAdresseMere'] ?? null,
        filiationProfessionMere: rows[0]['filiationProfessionMere'] ?? null,
        filiationIsFatherAlive: rows[0]['filiationIsFatherAlive'] ?? null,
        filiationIsMotherAlive: rows[0]['filiationIsMotherAlive'] ?? null
      };

      const deces = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        decesDateDeclaration: rows[0]['decesDateDeclaration'] == null ? null : new Date(rows[0]['decesDateDeclaration']),
        decesDate: rows[0]['decesDate'] == null ? null : new Date(rows[0]['decesDate']),
        decesHeure: rows[0]['decesHeure'] ?? null,
        decesLieu: rows[0]['decesLieu'] ?? null,
        decesNomEtablissement: rows[0]['decesNomEtablissement'] ?? null,
        decesAdresseLieuDeces: rows[0]['decesAdresseLieuDeces'] ?? null,
        decesVille: rows[0]['decesVille'] ?? null,
        decesCodePostal: rows[0]['decesCodePostal'] ?? null,
        decesTelephone: rows[0]['decesTelephone'] ?? null,
        decesFax: rows[0]['decesFax'] ?? null,
        decesDepartementDeces: rows[0]['decesDepartementDeces'] ?? null
      };

      const mise_en_biere = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        miseEnBiereLieu: rows[0]['miseEnBiereLieu'] ?? null,
        miseEnBiereDate: rows[0]['miseEnBiereDate'] == null ? null : new Date(rows[0]['miseEnBiereDate']),
        miseEnBiereHeure: rows[0]['miseEnBiereHeure'] ?? null,
        miseEnBiereToiletteDate: rows[0]['miseEnBiereToiletteDate'] == null ? null : new Date(rows[0]['miseEnBiereToiletteDate']),
        miseEnBiereToiletteHeure: rows[0]['miseEnBiereToiletteHeure'] ?? null,
        miseEnBiereLeveeDate: rows[0]['miseEnBiereLeveeDate'] == null ? null : new Date(rows[0]['miseEnBiereLeveeDate']),
        miseEnBiereLeveeHeure:rows[0]['miseEnBiereLeveeHeure'] ?? null,
        miseEnBiereDestination: rows[0]['miseEnBiereDestination'] ?? null,
        miseEnBierePassageLieuCulte: rows[0]['miseEnBierePassageLieuCulte'] ?? null,
        miseEnBiereLieuCulteNom: rows[0]['miseEnBiereLieuCulteNom'] ?? null,
        miseEnBiereLieuCulteAdresse: rows[0]['miseEnBiereLieuCulteAdresse'] ?? null,
        miseEnBierePriereHeure:rows[0]['miseEnBierePriereHeure'] ?? null,
        miseEnBiereToiletteLieu: rows[0]['miseEnBiereToiletteLieu'] ?? null,
        miseEnBiereAutorisationDe: rows[0]['miseEnBiereAutorisationDe'] ?? null,
        miseEnBiereDateAutorisationFerme: rows[0]['miseEnBiereDateAutorisationFerme'] == null ? null : new Date(rows[0]['miseEnBiereDateAutorisationFerme']),
        isMembreisDec: rows[0]['isMembreisDec'] ?? null,
        miseEnBierePresenceMembreFamille: rows[0]['miseEnBierePresenceMembreFamille'] ?? null,
        miseEnBiereMembreFamilleCivilite: rows[0]['miseEnBiereMembreFamilleCivilite'] ?? null,
        miseEnBiereMembreFamilleNom: rows[0]['miseEnBiereMembreFamilleNom'] ?? null,
        miseEnBiereMembreFamilleLienP: rows[0]['miseEnBiereMembreFamilleLienP'] ?? null,
        miseEnBiereMembreFamilleAdress: rows[0]['miseEnBiereMembreFamilleAdress'] ?? null
      };

      const situation_familiale = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        situationFamiliale: rows[0]['situationFamiliale'] ?? null,
        situationFamilialeNomMarie: rows[0]['situationFamilialeNomMarie'] ?? null,
        situationFamilialeNomVeuf: rows[0]['situationFamilialeNomVeuf'] ?? null,
        situationFamilialeNomDivorce: rows[0]['situationFamilialeNomDivorce'] ?? null,
        situationFamilialeNomPacse: rows[0]['situationFamilialeNomPacse'] ?? null
      };

      const cimetiere = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        nomDeCimetiere: rows[0]['nomDeCimetiere'] ?? null,
        adresseDeCimetiere: rows[0]['adresseDeCimetiere'] ?? null,
        dateDeCeremonie: rows[0]['dateDeCeremonie'] == null ? null : new Date(rows[0]['dateDeCeremonie']),
        heureDeCeremonie: rows[0]['heureDeCeremonie'] ?? null,
        codePostalDeCimetiere: rows[0]['codePostalDeCimetiere'] ?? null,
        villeDeCimetiere: rows[0]['villeDeCimetiere'] ?? null
      };

      const concession = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        isConceDeci: rows[0]['isConceDeci'] ?? null,
        civiliteDeConcessionaire: rows[0]['civiliteDeConcessionaire'] ?? null,
        nomDeConcessionaire: rows[0]['nomDeConcessionaire'] ?? null,
        prenomDeConcessionaire: rows[0]['prenomDeConcessionaire'] ?? null,
        adresseDeConcessionaire: rows[0]['adresseDeConcessionaire'] ?? null,
        lienDeParenteDeConcessionaire: rows[0]['lienDeParenteDeConcessionaire'] ?? null,
        dateAchatDeConcession: rows[0]['dateAchatDeConcession'] == null ? null : new Date(rows[0]['dateAchatDeConcession']),
        dureeDeConcession: rows[0]['dureeDeConcession'] ?? null,
        numeroDeConcession: rows[0]['numeroDeConcession'] ?? null
      };

      const rapatriement = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        rapatriementCodePostal: rows[0]['rapatriementCodePostal'] ?? null,
        rapatriementVilleDInhumation: rows[0]['rapatriementVilleDInhumation'] ?? null,
        rapatriementPaysDInhumation: rows[0]['rapatriementPaysDInhumation'] ?? null,
        rapatriementAdresseDInhumation: rows[0]['rapatriementAdresseDInhumation'] ?? null,
        rapatriementContactPaysInhumation: rows[0]['rapatriementContactPaysInhumation'] ?? null,
        rapatriementPhoneRespoPaysInhumation: rows[0]['rapatriementPhoneRespoPaysInhumation'] ?? null,
      };

      const vol = {
        numeroDefunt: parseInt(defuntID, 10) ?? null,
        volNumeroLTA: rows[0]['volNumeroLTA'] ?? null,
        numeroDeVol: rows[0]['numeroDeVol'] ?? null,
        volDateDepart: rows[0]['volDateDepart'] == null ? null : new Date(rows[0]['volDateDepart']),
        volDateArrivee: rows[0]['volDateArrivee'] == null ? null : new Date(rows[0]['volDateArrivee']),
        volCompagnieAerienne: rows[0]['volCompagnieAerienne'] ?? null,
        aeroportDeDepart: rows[0]['aeroportDeDepart'] ?? null,
        aeroportDArrivee: rows[0]['aeroportDArrivee'] ?? null,
        heureDepotAeroport: rows[0]['heureDepotAeroport'] ?? null,
        volHeureDepart: rows[0]['volHeureDepart'] ?? null,
        volHeureArrivee: rows[0]['volHeureArrivee'] ?? null,
      };

      let jsonData = {};
      jsonData['defunt'] = defunt;
      jsonData['decisionnaire'] = decisionnaire;
      jsonData['filiation'] = filiation;
      jsonData['situation_familiale'] = situation_familiale;
      jsonData['deces'] = deces;
      jsonData['mise_en_biere'] = mise_en_biere;
      jsonData['cimetiere'] = cimetiere;
      jsonData['concession'] = concession;
      jsonData['rapatriement'] = rapatriement;
      jsonData['vol'] = vol;


      resolve(jsonData);
    } catch (err) {
      console.log(err);
      saveLogs(`JsonP error : ${err}`);
      reject(err);
    }
  });
};