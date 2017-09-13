'use strict'
const winston = require( 'winston' )
const chalk = require( 'chalk' )
const mongoose = require( 'mongoose' )

const DataStream = require( '../../../../models/DataStream' )
const SpeckleObject = require( '../../../../models/SpeckleObject' )
const MergeLayers = require( '../../helpers/MergeLayers' )

module.exports = ( req, res ) => {

  winston.debug( chalk.bgGreen( 'Getting stream', req.params.streamId ) )

  if ( !req.params.streamId ) {
    res.status( 400 )
    return res.send( { success: false, message: 'No stream id provided.' } )
  }

  let geometries = [ ]
  let parsedObj = [ ]
  let myStream = {}
  DataStream.findOne( { streamId: req.params.streamId } )
    .then( stream => {
      if ( !stream ) throw new Error( 'No stream found.' )
      if ( !req.user || !( req.user._id.equals( stream.owner ) || stream.sharedWith.find( id => { return req.user._id.equals( id ) } ) ) )
        throw new Error( 'Unauthorized.' )

      myStream = stream
      myStream.objects = req.body.objects.map( o => new mongoose.mongo.ObjectId( o._id ) )
      myStream.layers = req.body.layers ? MergeLayers( myStream.layers, req.body.layers ) : myStream.layers
      myStream.name = req.body.name ? req.body.name : myStream.name
      myStream.markModified( 'layers' )
      myStream.markModified( 'objects' )
      return myStream.save( )
    } )
    .then( stream => {
      res.status( 200 )
      return res.send( { success: true, message: 'Stream was updated.', streamId: myStream.streamId } )
    } )
    .catch( err => {
      winston.error( err )
      res.status( 400 )
      res.send( { success: false, message: err.toString( ), streamId: req.streamId } )
    } )
}