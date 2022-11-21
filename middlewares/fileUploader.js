import multer from "multer";
import {v4 as uuidV4} from "uuid";
import os from "os";

const uploader = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, os.tmpdir());
        },
        filename(req, file, cb) {
            const id = uuidV4();
            cb(null, id + '-' + file.originalname);
        }
    })
});

export default uploader;