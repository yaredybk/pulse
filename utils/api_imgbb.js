/** API RESPOSE SAMPLE FOR
 * @url https://api.imgbb.com/1/upload
 */
// {
//   "data": {
//     "id": "2ndCYJK",
//     "title": "c1f64245afb2",
//     "url_viewer": "https://ibb.co/2ndCYJK",
//     "url": "https://i.ibb.co/w04Prt6/c1f64245afb2.gif",
//     "display_url": "https://i.ibb.co/98W13PY/c1f64245afb2.gif",
//     "width":"1",
//     "height":"1",
//     "size": "42",
//     "time": "1552042565",
//     "expiration":"0",
//     "image": {
//       "filename": "c1f64245afb2.gif",
//       "name": "c1f64245afb2",
//       "mime": "image/gif",
//       "extension": "gif",
//       "url": "https://i.ibb.co/w04Prt6/c1f64245afb2.gif",
//     },
//     "thumb": {
//       "filename": "c1f64245afb2.gif",
//       "name": "c1f64245afb2",
//       "mime": "image/gif",
//       "extension": "gif",
//       "url": "https://i.ibb.co/2ndCYJK/c1f64245afb2.gif",
//     },
//     "medium": {
//       "filename": "c1f64245afb2.gif",
//       "name": "c1f64245afb2",
//       "mime": "image/gif",
//       "extension": "gif",
//       "url": "https://i.ibb.co/98W13PY/c1f64245afb2.gif",
//     },
//     "delete_url": "https://ibb.co/2ndCYJK/670a7e48ddcb85ac340c717a41047e5c"
//   },
//   "success": true,
//   "status": 200
// }

/**
 * Fetch API response object.
 * @typedef {Object} ApiResponse
 * @property {Object} data - Data object.
 * @property {string} data.id - ID of the image.
 * @property {string} data.title - Title of the image.
 * @property {string} data.url_viewer - URL to view the image.
 * @property {string} data.url - Direct URL of the image.
 * @property {string} data.display_url - Display URL of the image.
 * @property {string} data.width - Width of the image.
 * @property {string} data.height - Height of the image.
 * @property {string} data.size - Size of the image.
 * @property {string} data.time - Time the image was uploaded.
 * @property {string} data.expiration - Expiration time of the image.
 * @property {Object} data.image - Image object.
 * @property {string} data.image.filename - Filename of the image.
 * @property {string} data.image.name - Name of the image.
 * @property {string} data.image.mime - MIME type of the image.
 * @property {string} data.image.extension - Extension of the image.
 * @property {string} data.image.url - Direct URL of the image.
 * @property {Object} data.thumb - Thumbnail object.
 * @property {string} data.thumb.filename - Filename of the thumbnail.
 * @property {string} data.thumb.name - Name of the thumbnail.
 * @property {string} data.thumb.mime - MIME type of the thumbnail.
 * @property {string} data.thumb.extension - Extension of the thumbnail.
 * @property {string} data.thumb.url - Direct URL of the thumbnail.
 * @property {Object} data.medium - Medium-sized image object.
 * @property {string} data.medium.filename - Filename of the medium-sized image.
 * @property {string} data.medium.name - Name of the medium-sized image.
 * @property {string} data.medium.mime - MIME type of the medium-sized image.
 * @property {string} data.medium.extension - Extension of the medium-sized image.
 * @property {string} data.medium.url - Direct URL of the medium-sized image.
 * @property {string} data.delete_url - URL to delete the image.
 * @property {boolean} success - Indicates if the request was successful.
 * @property {number} status - HTTP status code of the response.
 */

const imgbb_url = `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_KEY}`;
/**
 * uploads images to https://api.imgbb.com/1/upload
 * @param {Blob} imageFile image file
 * @returns {Promise<{ err:any, data: { delete_url:string, display_url:string, thumb_url:string } }>}
 */
async function _uploadImage(imageFile) {
  console.log(imageFile);
  const fileBlob = new Blob([imageFile.data], {
    type: imageFile.mimetype,
  });
  const f = new FormData();
  f.append('image', fileBlob, imageFile.name);
  try {
    const res = await fetch(imgbb_url, {
      method: 'POST',
      body: f,
    });
    console.log(res);
    if (!res || !res.ok) throw new Error('failed to upload');
    /**
     * @type {ApiResponse}
     */
    const data_ = await res.json();
    console.log(data_);
    if (!data_.success) throw new Error('failed to upload');
    const {
      delete_url,
      display_url,
      thumb: { url: thumb_url },
    } = data_?.data;

    console.log({ delete_url, display_url, thumb_url });
    return {
      err: null,
      data: { delete_url, display_url, thumb_url },
    };
  } catch (err) {
    console.warn(err);
    return { err, data: null };
  }
}

module.exports = { _uploadImage };
