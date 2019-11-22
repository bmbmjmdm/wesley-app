import dogPic from '../assets/dog.jpg';
import parkPic from '../assets/park.jpg';
import readingPic from '../assets/reading.jpg';
import applePic from '../assets/apple.jpg';
import flowersPic from '../assets/flowers.jpg';
import cloudsPic from '../assets/clouds.jpg';
import catPic from '../assets/cat.jpg';
import grandmaPic from '../assets/grandma.jpg';
import smilePic from '../assets/smile.jpg';
import sheepPic from '../assets/sheep.jpg';
import dadPic from '../assets/dad.jpg';
import kittenPic from '../assets/kitten.jpg';
import towerPic from '../assets/tower.jpg';
import treePic from '../assets/tree.jpg';

export default [
    {targetWord: "dog", allWords: [{word: "flowers", pic: flowersPic}, {word: "tree", pic: treePic}, {word: "smile", pic: smilePic}, {word: "dog", pic: dogPic}] },
    {targetWord: "park", allWords: [{word: "park", pic: parkPic}, {word: "tower", pic: towerPic}, {word: "grandma", pic: grandmaPic}, {word: "dog", pic: dogPic}] },
    {targetWord: "apple", allWords: [{word: "dad", pic: dadPic}, {word: "reading", pic: readingPic}, {word: "apple", pic: applePic}, {word: "sheep", pic: sheepPic}] },
    {targetWord: "reading", allWords: [{word: "park", pic: parkPic}, {word: "reading", pic: readingPic}, {word: "apple", pic: applePic}, {word: "cat", pic: catPic}] },
    {targetWord: "clouds", allWords: [{word: "flowers", pic: flowersPic}, {word: "tree", pic: treePic}, {word: "smile", pic: smilePic}, {word: "clouds", pic: cloudsPic}] },
    {targetWord: "flowers", allWords: [{word: "flowers", pic: flowersPic}, {word: "apple", pic: applePic}, {word: "grandma", pic: grandmaPic}, {word: "dog", pic: dogPic}] },
    {targetWord: "cat", allWords: [{word: "dad", pic: dadPic}, {word: "reading", pic: readingPic}, {word: "cat", pic: catPic}, {word: "sheep", pic: sheepPic}] },
    {targetWord: "grandma", allWords: [{word: "park", pic: parkPic}, {word: "grandma", pic: grandmaPic}, {word: "apple", pic: applePic}, {word: "cat", pic: catPic}] },
    {targetWord: "smile", allWords: [{word: "smile", pic: smilePic}, {word: "sheep", pic: sheepPic}, {word: "tower", pic: towerPic}, {word: "cat", pic: catPic}] },
    {targetWord: "sheep", allWords: [{word: "clouds", pic: cloudsPic}, {word: "sheep", pic: sheepPic}, {word: "tower", pic: towerPic}, {word: "dad", pic: dadPic}] },
    {targetWord: "dad", allWords: [{word: "clouds", pic: cloudsPic}, {word: "kitten", pic: kittenPic}, {word: "tree", pic: treePic}, {word: "dad", pic: dadPic}] },
    {targetWord: "kitten", allWords: [{word: "clouds", pic: cloudsPic}, {word: "kitten", pic: kittenPic}, {word: "dog", pic: dogPic}, {word: "park", pic: parkPic}] },
    {targetWord: "tower", allWords: [{word: "tower", pic: towerPic}, {word: "kitten", pic: kittenPic}, {word: "grandma", pic: grandmaPic}, {word: "flowers", pic: flowersPic}] },
    {targetWord: "tree", allWords: [{word: "kitten", pic: kittenPic}, {word: "tree", pic: treePic}, {word: "smile", pic: smilePic}, {word: "reading", pic: readingPic}] },
    
]