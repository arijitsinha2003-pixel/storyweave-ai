import heroCanvasImg from '../assets/images/hero_storyweave_canvas_1794583991547.jpg';
import varanasiImg from '../assets/images/story_varanasi_ghats_1794628547728.jpg';
import darjeelingImg from '../assets/images/story_darjeeling_mist_1794628548817.jpg';
import shillongImg from '../assets/images/story_shillong_monsoon_1794628547458.jpg';
import { StoryRecord } from '../types/story';

export const HERO_CANVAS_IMAGE = heroCanvasImg;

export const EXAMPLE_STORIES: StoryRecord[] = [
  {
    id: 'example-varanasi-ghats',
    title: 'The Lantern Keeper of Manikarnika',
    description:
      'A nocturnal boatman on the Varanasi ghats discovers floating brass diyas that preserve the unspoken final letters of strangers.',
    genre: 'Magical Realism',
    tone: 'Atmospheric',
    writingStyle: 'Lyrical',
    lengthLabel: 'Medium',
    language: 'en',
    wordCount: 840,
    coverImage: varanasiImg,
    characters: ['Devendra', 'Meera', 'Pandit Harish'],
    conflict:
      'When an unsigned copper-sealed lantern arrives carrying Meera’s handwriting from twenty years ago, Devendra must choose between safeguarding the river’s quiet archive or uncovering the truth behind her disappearance.',
    climax:
      'During the Dev Deepawali tide, thousands of lamps illuminate the submerged sandstone steps, revealing a sunken alcove where old river ledgers are bound in waterproof lotus silk.',
    resolution:
      'Devendra returns the final letter to Meera’s daughter at dawn, turning an archive of grief into a living bridge between generations.',
    narrative:
      'Before the first conch shell sounded across Dashashwamedh, Devendra knew the river kept a second memory beneath its dark current. Every night after the aarti bells faded into woodsmoke and marigold ash, he rowed his teakwood skiff along the stone steps of Varanasi to gather the brass diyas that refused to sink. Most carried simple prayers—an exam passed, a monsoon forgiven, a safe train home from Howrah. Yet once each winter, a sealed lantern drifted past Manikarnika burning with a pale violet flame that no river wind could extinguish, waiting for someone patient enough to read what the smoke remembered.',
    updatedAt: 'Showcase · Varanasi',
  },
  {
    id: 'example-darjeeling-mist',
    title: 'Last Train from Ghoom',
    description:
      'A misty Himalayan hill-station mystery unfolds aboard the century-old toy train when an unpublished tea-planter diary surfaces.',
    genre: 'Mystery',
    tone: 'Suspenseful',
    writingStyle: 'Descriptive',
    lengthLabel: 'Medium',
    language: 'en',
    wordCount: 920,
    coverImage: darjeelingImg,
    characters: ['Inspector Ananya Sen', 'Tenzing Bhutia', 'Clara Bose'],
    conflict:
      'A dense December fog stalls the narrow-gauge locomotive above Batasia Loop just as a coded botanical ledger vanishes from the guard van.',
    climax:
      'Inside the clock-tower water tank at Ghoom station, Ananya deciphers the crimson ink marginalia connecting a 1924 silver-tip tea harvest to a modern smuggling ring.',
    resolution:
      'As morning breaks over Kanchenjunga, the whistle clears the ridge and the ledger is restored to the Darjeeling Heritage Archive.',
    narrative:
      'Blue pine smoke curled across the iron rails of Ghoom as the miniature steam engine panted against the incline. From the timber window of the first-class carriage, Ananya Sen watched prayer flags vanish one by one into the silver Himalayan cloudbank. Somewhere in the luggage van ahead sat a brass-clasped estate diary stained with bergamot and Darjeeling first flush—and someone sharing her compartment had boarded at Kurseong solely to make sure the manuscript never reached Siliguri.',
    updatedAt: 'Showcase · Darjeeling',
  },
  {
    id: 'example-shillong-monsoon',
    title: 'The Living Root Bridge of Cherrapunji',
    description:
      'During the heaviest monsoon in a decade, a young acoustic architect hears an ancient Khasi valley melody humming through living Ficus roots.',
    genre: 'Fantasy',
    tone: 'Hopeful',
    writingStyle: 'Cinematic',
    lengthLabel: 'Long',
    language: 'en',
    wordCount: 1080,
    coverImage: shillongImg,
    characters: ['Kyrshan', 'Naphisabet', 'Elder Bah'],
    conflict:
      'Floodwaters threaten to sever the century-old living root crossing between two cliffside hamlets unless the harmonic stonework beneath the canyon is realigned.',
    climax:
      'Guided by Elder Bah’s bamboo flute, Kyrshan and Naphisabet descend into the mist-drenched gorge at midnight to clear the choked limestone sluice and weave young aerial roots into the trembling span.',
    resolution:
      'By sunrise the roaring cascade settles into a silver ribbon, and children cross the strengthened root bridge singing the valley’s rain-song.',
    narrative:
      'In Meghalaya, rain does not merely fall—it composes architecture out of mist and emerald moss. Kyrshan knelt beside the braided Ficus elastica roots spanning the canyon below Nongriat, pressing his ear to the wet bark. Beneath the thunder of Nohkalikai’s distant plunge, the woven timber hummed like a taut sarangi string, answering the mountain’s breath.',
    updatedAt: 'Showcase · Shillong',
  },
];
