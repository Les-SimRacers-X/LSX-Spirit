function chunkOptions(options, maxOptionsPerMenu = 25, maxMenus = 5) {
  const chunks = []
  const maxTotal = maxOptionsPerMenu * maxMenus

  for (let i = 0; i < options.length && i < maxTotal; i += maxOptionsPerMenu) {
    chunks.push(options.slice(i, i + maxOptionsPerMenu))
  }

  return chunks
}

module.exports = { chunkOptions }
