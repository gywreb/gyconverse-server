const shuffleArray = (array) => {
  for (let index = array.length - 1; index > 0; index--) {
    const j = Math.floor(Math.random() * (index + 1));
    const temp = array[index];
    array[index] = array[j];
    array[j] = temp;
  }
  return array;
};

module.exports = shuffleArray;
