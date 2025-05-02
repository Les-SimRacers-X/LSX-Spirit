const { fetchUserByIdQuery } = require("../functions/queries")

async function licenceDisplayComponents(userId) {
  const [users] = await fetchUserByIdQuery(userId)

  if (!users.length) {
    
  }
}
