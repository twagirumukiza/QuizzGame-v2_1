// V2: thèmes étendus, prévoir deux banques distinctes (manche1/manche2) pour éviter toute répétition.
const QUESTION_BANK = {
  general: [
    ["Quelle planète est surnommée la planète rouge ?",["Vénus","Mars","Jupiter","Mercure"],1],
    ["Quel est le plus grand océan du monde ?",["Atlantique","Indien","Arctique","Pacifique"],3],
    ["Combien de côtés possède un hexagone ?",["5","6","7","8"],1],
    ["Quel gaz les plantes absorbent-elles principalement ?",["Oxygène","Hydrogène","Dioxyde de carbone","Azote"],2],
    ["Dans quel pays se trouve la ville de Kyoto ?",["Chine","Corée du Sud","Japon","Thaïlande"],2],
    ["Quel instrument mesure les séismes ?",["Baromètre","Sismographe","Altimètre","Hygromètre"],1],
    ["Quel est le symbole chimique de l’or ?",["Ag","Au","O","Or"],1],
    ["Combien de joueurs une équipe de football aligne-t-elle au coup d’envoi ?",["9","10","11","12"],2],
    ["Quel est le plus long fleuve d’Afrique ?",["Congo","Niger","Nil","Zambèze"],2],
    ["Quelle langue est principalement parlée au Brésil ?",["Espagnol","Portugais","Français","Italien"],1],
    ["Quel organe pompe le sang dans le corps humain ?",["Poumon","Foie","Cœur","Rein"],2],
    ["Quelle est la capitale du Canada ?",["Toronto","Montréal","Ottawa","Vancouver"],2],
    ["Quel métal est liquide à température ambiante ?",["Fer","Mercure","Cuivre","Aluminium"],1],
    ["Combien de minutes y a-t-il dans deux heures ?",["100","110","120","140"],2],
    ["Quel animal est le plus grand mammifère vivant ?",["Éléphant d’Afrique","Baleine bleue","Girafe","Requin-baleine"],1],
    ["Quel continent compte le plus de pays ?",["Europe","Asie","Afrique","Amérique du Sud"],2],
    ["Quel est le résultat de 12 × 8 ?",["86","92","96","108"],2],
    ["Quelle couleur obtient-on en mélangeant bleu et jaune ?",["Orange","Vert","Violet","Marron"],1]
  ],
  contemporary: [
    ["Quel réseau social est connu pour ses vidéos courtes verticales ?",["LinkedIn","TikTok","Reddit","Wikipedia"],1],
    ["Que signifie l’abréviation IA ?",["Internet automatisé","Intelligence artificielle","Interface avancée","Information augmentée"],1],
    ["Quel service est principalement utilisé pour regarder des séries en streaming ?",["Netflix","Dropbox","Slack","Waze"],0],
    ["Quel appareil portable compte souvent les pas ?",["Routeur","Montre connectée","Scanner","Projecteur"],1],
    ["Quel format est couramment utilisé pour les podcasts ?",["Audio","Tableur","Image fixe","Carte papier"],0],
    ["Quel terme désigne une émission diffusée en direct sur internet ?",["Livestream","Firmware","Cookie","Hashtag"],0],
    ["Quelle technologie permet le paiement sans contact ?",["NFC","VGA","FTP","GPS"],0],
    ["Quel symbole précède souvent un mot-clé sur les réseaux sociaux ?",["&","#","%","@"],1],
    ["Quel service permet des réunions vidéo en ligne ?",["Zoom","Excel","Photoshop","Spotify"],0],
    ["Quel terme désigne une fausse information largement diffusée ?",["Podcast","Désinformation","Archive","Playlist"],1],
    ["Quel objet est utilisé pour recharger un smartphone sans câble ?",["Chargeur à induction","Carte SIM","Disque dur","Clé USB"],0],
    ["Quel terme désigne une personne qui crée régulièrement du contenu en ligne ?",["Influenceur","Archiviste","Imprimeur","Cartographe"],0],
    ["Quel système d’exploitation équipe de nombreux iPhone ?",["Android","Linux","iOS","Windows"],2],
    ["Quel service stocke des fichiers à distance sur internet ?",["Cloud","Bluetooth","BIOS","Cache"],0],
    ["Quel terme désigne une monnaie numérique décentralisée ?",["Cryptomonnaie","Coupon","Action papier","Jeton de métro"],0],
    ["Quel type de casque ajoute des éléments numériques au monde réel ?",["Réalité augmentée","Radio FM","Infrarouge","Télétexte"],0],
    ["Quel mot désigne une image humoristique virale sur internet ?",["Mème","Codec","Script","Pixel mort"],0],
    ["Quel format de contenu disparaît souvent après 24 heures ?",["Story","Wiki","Forum","Newsletter"],0]
  ],
  history: [
    ["En quelle année débute la Révolution française ?",["1776","1789","1815","1848"],1],
    ["Quel empire avait Rome pour capitale ?",["Empire romain","Empire ottoman","Empire aztèque","Empire du Mali"],0],
    ["Qui a été le premier homme à marcher sur la Lune ?",["Youri Gagarine","Buzz Aldrin","Neil Armstrong","John Glenn"],2],
    ["Quel mur est tombé en 1989 ?",["Mur d’Hadrien","Mur de Berlin","Grande Muraille","Mur des Lamentations"],1],
    ["Quelle civilisation a construit Machu Picchu ?",["Maya","Inca","Romaine","Phénicienne"],1],
    ["Quel roi de France était surnommé le Roi-Soleil ?",["Louis IX","Louis XIV","Henri IV","François Ier"],1],
    ["Dans quel pays les Jeux olympiques antiques sont-ils nés ?",["Italie","Égypte","Grèce","Turquie"],2],
    ["Quel navigateur atteint l’Amérique en 1492 ?",["Magellan","Christophe Colomb","Vasco de Gama","James Cook"],1],
    ["Quelle guerre oppose principalement le Nord et le Sud des États-Unis ?",["Guerre de Sécession","Guerre de Crimée","Guerre des Boers","Guerre de Cent Ans"],0],
    ["Quel peuple a construit les pyramides de Gizeh ?",["Égyptiens antiques","Vikings","Gaulois","Mongols"],0],
    ["Quel événement marque traditionnellement la fin du Moyen Âge ?",["Chute de Constantinople","Bataille de Verdun","Révolution russe","Traité de Rome"],0],
    ["Qui était Jeanne d’Arc ?",["Une reine d’Angleterre","Une figure militaire française","Une scientifique","Une impératrice romaine"],1],
    ["Quel empire était dirigé par Mansa Moussa ?",["Empire du Mali","Empire mongol","Empire byzantin","Empire inca"],0],
    ["Quel conflit mondial se termine en 1945 ?",["Première Guerre mondiale","Seconde Guerre mondiale","Guerre froide","Guerre de Corée"],1],
    ["Quel peuple est associé aux drakkars ?",["Vikings","Samouraïs","Spartiates","Aztèques"],0],
    ["Quelle ville fut ensevelie par le Vésuve en 79 ?",["Pompéi","Athènes","Sparte","Troie"],0],
    ["Quel document anglais de 1215 limite le pouvoir royal ?",["Magna Carta","Code civil","Déclaration de Balfour","Traité de Versailles"],0],
    ["Quel pays a offert la Statue de la Liberté aux États-Unis ?",["Espagne","France","Italie","Canada"],1]
  ],
  cinema: [
    ["Qui a réalisé Titanic ?",["Steven Spielberg","James Cameron","Christopher Nolan","Ridley Scott"],1],
    ["Dans quelle série trouve-t-on Walter White ?",["Narcos","Breaking Bad","Ozark","Lost"],1],
    ["Quel film met en scène Dark Vador ?",["Star Trek","Star Wars","Dune","Avatar"],1],
    ["Qui interprète Harry Potter au cinéma ?",["Daniel Radcliffe","Rupert Grint","Tom Holland","Elijah Wood"],0],
    ["Dans Friends, quel est le prénom de la sœur de Monica ?",["Rachel","Phoebe","Ross","Emily"],2]
  ]
};

function buildQuestionSet(topic, count, multipliers = false) {
  const source = [...(QUESTION_BANK[topic] || QUESTION_BANK.general)].sort(() => Math.random() - .5);
  const selected = source.slice(0, count).map((q, i) => ({id:`${Date.now()}-${i}`, text:q[0], choices:q[1], correct:q[2], multiplier:1}));
  if (multipliers && selected.length >= 4) {
    const positions = [...selected.keys()].sort(() => Math.random() - .5);
    positions.slice(0,3).forEach(i => selected[i].multiplier = 2);
    selected[positions[3]].multiplier = 3;
  }
  return selected;
}
