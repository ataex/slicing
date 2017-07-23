// Copyright (c) 2016 - 2017, Polar 3D LLC
// All rights reserved
//
// https://polar3d.com/

'use strict';

var env = process.env.NODE_ENV || 'development';
var config = require('../config/' + env);

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//var file_url_regex = new RegExp(`^https:\/\/s3\.amazonaws\.com\/${config.s3.bucket.replace(/\./g, '\\.')}\/files\/objects\/2\/[\\w\\-]{7,14}\\.stl$|^https:\/\/s3\.amazonaws\.com\/${config.s3.bucket.replace(/\./g, '\\.')}\/files\/objects\/[\\d]{1,10}-[\\w\\-]{7,14}\/parts\/.*\\.stl$`);

var PrintJobSchemaJSON = {

  job_id: {
    type: Number,
    min: 0,
    required: true,
    index: true
  },

  slug: String,

  // 2 for Cloud 2.0
  // 1 for migrated from Cloud 1.0
  //
  // Indicates where the rendering of the printed part is:
  //
  //   2 -> /files/objects/SERIAL_NUMBER/JOB_ID/image.png
  //        /files/objects/SERIAL_NUMBER/JOB_ID/image-thumb.png
  //
  //   1 -> /images/objects/medium/<obj-string>.png
  //        /images/objects/thumb/<obj-string>.png

  storage_method: {
    type: Number,
    min: 1,
    max: 2,
    default: 2,
    required: true
  },

  // When storage_method == 1, this is hashEncode(Cloud 1.0 object id)
  //   Used to locate the object stl and images
  object_str: String,

  owner_id: {
    type: Schema.Types.ObjectId,
    index: true
  },

  owner_name: String,
  owner_photo_url: String,
  owner_photo_thumbnail_url: String,

  managers_id: [ {
    type: Schema.Types.ObjectId,
    index: true
  } ],

  printer_id: {
    type: Schema.Types.ObjectId
    // index: true // is in a compound index with owner_id
  },

  pool_id: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true
  },

  serial_number: {
    type: String,
    minlength: 1,
    maxlength: 32,
    uppercase: true,
    index: true
  },

  pool_number: {
    type: String,
    minlength: 1,
    maxlength: 32,
    uppercase: true,
    required: true,
    index: true
  },

  printer_name: {
    type: String,
    minlength: 1,
    maxlength: 150
  },

  pool_name: {
    type: String,
    minlength: 1,
    maxlength: 150
  },

  // Print job name
  name: {
    type: String,
    maxLength: 120,
    default: 'object.stl'
  },

  // _id into objects collection
  objects: [
    {
      // db _id of the object from which this part came
      object_id: {
        type: Schema.Types.ObjectId,
        index: true
      },
      // Object's part _id
      _id: Schema.Types.ObjectId,
      name: {
        type: String,
        minlength: 1,
        maxlength: 120,
        default: 'object.stl'
      },
      // Full URL to the file/part
      file_url: {
        type: String,
        // match: file_url_regex,
        maxlength: 512
      },
      // Full URL to the file/parts rendering
      photo_url: {
        type: String,
        maxlength: 256
      },
      // Data for the front end (e.g., x,y,z position, sx,sy,sz scaling, rx,ry,rz rotations)
      data: {
        type: String,
        minlength: 0,
        maxlength: 1024
      }
    }
  ],

  // 1: queued
  // 2: ready to print (queued & config.ini generated)
  // 3: completed
  // 4: canceled
  queue_status: {
    type: Number,
    min: 1,
    max: 20,
    default: 1,
    required: true
  },

  // Whether or not the image needs to be rotated 180 degrees
  rotate_image: {
    type: Boolean,
    default: false
  },

  //  transform_image overrides rotate_image: bitmask
  //    bit   value    operation   description
  //    ---   -----    ---------   ------------
  //     0      1      reflect-H   reflect about the horizontal midline; e.g., CSS scaleY(-1)
  //     1      2      reflect-V   reflect about the vertical midline; e.g., CSS scaleX(-1)
  //     2      4      rotate-90   rotate 90 degrees counter clockwise; e.g., CSS rotate(-90)
  //
  // rotate-90 is always applied LAST
  //
  // A rotation of 180 degrees is thus value 0b011 = 0x03 = 3 (reflect-H reflect-V)
  // A rotation of  90 degrees clockwise is value 0b111 = 0x07 = 7 (both reflections followed by rotate-90)
  transform_image: {
    type: Number,
    default: 0,
    min: 0,
    max: 7
  },

  slicing: {
    status: Number,
    jobID: String,
    progress: String,
    progressDetail: String
  },

  data: {

    status: {
      type: Number,
      min: 0,
      max: 11,
      required: true,
      default: 0
    },

    progress: {
      type: String,
      maxlength: 32
    },

    progressDetail: {
      type: String,
      maxlength: 128
    },

    estimatedTime: {
      type: Number, //
      min: 0
    },

    filamentUsed: {
      type: Number, //
      min: 0
    },

    startTime: Date,

    printSeconds: {
      type: Number,
      min: 0
    },

    bytesRead: {
      type: Number,
      min: 0
    },

    fileSize: {
      type: Number,
      min: 0,
    },

    temperature: Number,

    targetTemperature: Number,

    temperature_2: Number,

    temperature_bed: Number,

    jobID: {
      type: String,
      maxlength: 64
    },

    file: {
      type: String,
      maxlength: 100
    },

    config: {
      type: String,
      maxlength: 100
    },

    securityCode: {
      type: String,
      maxlength: 36
    }

  },

  // We don't need to index the creation date as we can use the _id for that
  //  ... and note that the _id is the same between print_jobs and completed_jobs
  // but we do it anyway
  create_date: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Used to sort jobs in the queue
  queue_sort_date: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Indexing of the next two dates is in the model
  //   For example, we don't need to index completed_date for print_jobs,
  //   just completed_jobs
  print_date: Date,

  completed_date: Date,

  last_modified: {
    type: Date,
    default: Date.now,
    required: true
  },

  photo_url: String,

  // For historical reasons, these do not use '_url' in their names
  stl_file: String,
  json_file: String,
  config_file: String,
  gcode_file: String

};

module.exports = PrintJobSchemaJSON;