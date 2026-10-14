/*
  quiz-data.js — every question, score, colour and line of copy lives here.
  Edit freely, but if you change ANY score or colour point, re-run:
      node scripts/check-distribution.js

  E = Energy (negative = calm, positive = loud)
  V = Vibe   (negative = classic, positive = playful)
  Scores are never shown to players.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    site: {
      title: "What's Your Navratri Colour?",
      hook: '8 questions. Zero overthinking. One outfit colour.',
      credit: 'ADS X Jazbaa',
      // Society logos. Drop files in images/ and set the paths (e.g. 'images/logo-ads.png');
      // while empty, a round placeholder badge is shown instead.
      societies: [
        { name: 'Ashoka Data Society', short: 'ADS', logo: 'images/ADSlogo.jpg' },
        { name: 'Jazbaa', short: 'J', logo: 'images/jazbaa-logo.jpg' },
      ],
      // big stacked type on the loading screen (one entry per row)
      loaderRows: ['ASHOKA', 'DATA', 'SOCIETY', 'X', 'JAZBAA'],
      shareUrl: '', // leave empty to share the page's own URL
    },

    questions: [
      {
        text: "It's 11pm and your friends text “come out?”",
        options: [
          { text: 'Already wearing shoes', e: 2, v: 1 },
          { text: '“Only if there’s food”', e: 0, v: 0 },
          { text: 'You’ll reply tomorrow morning', e: -2, v: 0 },
          { text: 'Counter-offer: 2am chai run', e: 1, v: 2 },
        ],
      },
      {
        text: 'Group project. Your role is…',
        options: [
          { text: 'Making the slides look pretty', e: 0, v: 2 },
          { text: 'Deadline enforcer', e: 1, v: -2 },
          { text: 'Silent carry', e: -1, v: -1 },
          { text: 'Hype person', e: 2, v: 1 },
        ],
      },
      {
        text: 'Your ideal Sunday',
        options: [
          { text: 'Slow brunch and journaling in a café', e: -2, v: 1 },
          { text: 'Clean room, meal prep, life sorted', e: -1, v: -2 },
          { text: 'Spontaneous road trip', e: 2, v: 1 },
          { text: 'Gym, then a productive errand list', e: 1, v: -2 },
        ],
      },
      {
        text: 'Your camera roll is mostly…',
        options: [
          { text: 'Screenshots of things you’ll “deal with later”', e: -1, v: -1 },
          { text: 'Sunsets and animals', e: -1, v: 1 },
          { text: '400 blurry selfies with friends', e: 1, v: 2 },
          { text: 'Shaky concert videos', e: 2, v: 0 },
        ],
      },
      {
        text: 'At garba night you’re…',
        options: [
          { text: 'In the inner circle doing the hardest steps', e: 2, v: -1 },
          { text: 'Inventing your own steps and dragging people in', e: 1, v: 2 },
          { text: 'Taking photos of everyone looking cute', e: -1, v: 1 },
          { text: 'At the food stall, judging', e: -1, v: -1 },
        ],
      },
      {
        text: 'Pick a superpower',
        options: [
          { text: 'Teleport home whenever you want', e: -2, v: 0 },
          { text: 'Never forget anything', e: 0, v: -2 },
          { text: 'Talk to animals', e: -1, v: 2 },
          { text: 'Everyone has to listen when you speak', e: 2, v: -1 },
        ],
      },
      {
        text: 'What’s on your playlist right now?',
        options: [
          { text: 'Old Bollywood classics', e: 0, v: -2 },
          { text: 'Bhangra bangers at full volume', e: 2, v: 2 },
          { text: 'Whatever’s trending on Reels', e: 1, v: 1 },
          { text: 'Lo-fi beats', e: -2, v: 0 },
        ],
      },
      {
        text: 'Your role in the group chat',
        options: [
          { text: 'The one who makes plans actually happen', e: 1, v: -2 },
          { text: 'Lurker who reacts with one emoji', e: -2, v: 0 },
          { text: 'Sends 40 messages in a row', e: 2, v: 1 },
          { text: 'Meme supplier', e: 0, v: 2 },
        ],
      },
    ],

    /*
      Colour points, headlines and blurbs. ORDER MATTERS: it is also the tie-break order.
      Do not change e / v without re-running the distribution check.
      Theme fields (all hex):
        main     page background / hero          onMain  text on main
        dark     accents + button background     btn / btnInk  override button colours (optional)
        tint     card background                 tintInk text on cards
        swatch   the dot shown in the ring and chart
    */
    colours: [
      {
        key: 'red', name: 'Red', e: 1.15, v: -0.17,
        headline: 'The Main Character',
        blurb: 'Bold, intense and impossible to ignore. You walk in and the room notices.',
        her: 'Red chaniya choli with gold mirror work',
        him: 'Red bandhani kurta with an off-white dhoti or churidar',
        theme: { main: '#C8102E', onMain: '#FFFFFF', dark: '#8E0B20', tint: '#FDE8EA', tintInk: '#2B0A10', swatch: '#C8102E' },
      },
      {
        key: 'orange', name: 'Orange', e: 0.73, v: 0.83,
        headline: 'The Chaos Coordinator',
        blurb: 'Chaotic good. You’re the reason the night became a story.',
        her: 'Orange lehenga with a contrast bandhani dupatta',
        him: 'Saffron kediyu with mirror-work trims',
        theme: { main: '#F26B1D', onMain: '#2A1200', dark: '#A8420A', tint: '#FFEBDD', tintInk: '#2A1200', swatch: '#F26B1D' },
      },
      {
        key: 'yellow', name: 'Yellow', e: 0.31, v: 0.93,
        headline: 'The Human Sunshine',
        blurb: 'Everyone’s friend, and somehow always laughing. You make every circle bigger.',
        her: 'Yellow ghagra with colourful gota patti borders',
        him: 'Mustard kurta with a printed Nehru jacket',
        theme: { main: '#F7C61B', onMain: '#2B2000', dark: '#6B5000', tint: '#FFF6D1', tintInk: '#2B2000', swatch: '#F7C61B' },
      },
      {
        key: 'pink', name: 'Pink', e: -0.23, v: 0.84,
        headline: 'The Soft Romantic',
        blurb: 'Warm, dreamy and a little dramatic, in the best way.',
        her: 'Rani pink chaniya choli with silver mirror work',
        him: 'Pink kurta with white churidar and a printed stole',
        theme: { main: '#EE5E93', onMain: '#3A0A1E', dark: '#A3194F', tint: '#FDE6EF', tintInk: '#3A0A1E', swatch: '#EE5E93' },
      },
      {
        key: 'white', name: 'White', e: -0.71, v: 0.43,
        headline: 'The Quiet Glow',
        blurb: 'Serene and quietly confident. You don’t chase the vibe, you are the vibe.',
        her: 'White chikankari lehenga with a multicolour dupatta',
        him: 'White kediyu with colourful embroidery',
        theme: { main: '#F6F1E7', onMain: '#1E1B4B', dark: '#2B2A6B', tint: '#FFFFFF', tintInk: '#1E1B4B', swatch: '#FFFFFF' },
      },
      {
        key: 'green', name: 'Green', e: -0.46, v: -0.69,
        headline: 'The Steady One',
        blurb: 'Grounded and nurturing. The friend with snacks, a charger and a plan B.',
        her: 'Emerald chaniya choli with golden borders',
        him: 'Green kurta with an ivory dhoti',
        theme: { main: '#0F7B55', onMain: '#FFFFFF', dark: '#0A5A3E', tint: '#DFF3EA', tintInk: '#06261B', swatch: '#0F7B55' },
      },
      {
        key: 'black', name: 'Black', e: 0.41, v: -0.87,
        headline: 'The Enigma',
        blurb: 'Cool, mysterious and effortlessly put-together. Nobody knows your secrets.',
        her: 'Black lehenga with bright multicolour thread work',
        him: 'Black kurta with a mirror-work jacket',
        theme: { main: '#16161B', onMain: '#F6F1E7', dark: '#F5B93A', tint: '#25252E', tintInk: '#F6F1E7', btn: '#F5B93A', btnInk: '#16161B', swatch: '#1A1A1F' },
      },
    ],
  };
});
