// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  // get the tokenId from the query params
  const tokenId = req.query.tokenId;
  // As all the images are uploaded on github, we can extract the images from github directly.
  const name = `Crypto Dev #${tokenId}`;
  const description = "Crypto Dev is a collection of developers in crypto";
  const image =
    `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${Number (tokenId) - 1}.svg`;
  // The api is sending back metadata for a Crypto Dev
  // To make our collection compatible with Opensea, we need to follow some Metadata standards
  // when sending back the response from the api
  res.status(200).json({
    name: name,
    description: description,
    image: image,
  });
}
