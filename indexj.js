const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name;
  const Key = event.Records[0].s3.object.key;
  const filename = Key.split('/')[Key.split('/').length - 1]; // /로 나눈 배열 중 제일 마지막 인덱스 -> 파일명
  const ext = Key.split('.')[Key.split('.').length -1]; // .으로 나눈 배열 중 제일 마지막 인덱스 -> 확장자
  const requiredFormat = ext === 'jpg' ? 'jpeg' : ext; // sharp에서는 jpg 대신 jpeg를 사용하므로 작성
  console.log('name', filename, 'ext', ext);

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise(); // 버퍼로 가져오기
    console.log('original', s3Object.Body.length);
    const resizedImage = await sharp(s3Object.Body) // 리사이징
      .resize(400, 400, { fit: 'inside' })
      .toFormat(requiredFormat)
      .toBuffer(); // 리사이징된 결과물이 버퍼로 나옴
    await s3.putObject({ // thumb 폴더에 저장
      Bucket,
      Key: `thumb/${filename}`,
      Body: resizedImage,
    }).promise();
    console.log('put', resizedImage.length);
    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};