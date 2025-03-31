const flightService = require('../services/flight/flight.service');


exports.getFlights = async (req, res, next) => {
  try {
    const { source, destination, date, airline } = req.query;
    
    const result = await flightService.getFlights({
      source,
      destination,
      date,
      airline
    });
    
    res.status(200).json({
      success: true,
      count: result.flights.length,
      data: result.flights,
      fromCache: result.fromCache
    });
  } catch (error) {
    next(error);
  }
};


exports.getFlight = async (req, res, next) => {
  try {
    const flight = await flightService.getFlightById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: flight
    });
  } catch (error) {
    next(error);
  }
};


exports.createFlight = async (req, res, next) => {
  try {
    const flight = await flightService.createFlight(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Flight created successfully',
      data: flight
    });
  } catch (error) {
    next(error);
  }
};


exports.updateFlight = async (req, res, next) => {
  try {
    const flight = await flightService.updateFlight(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Flight updated successfully',
      data: flight
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteFlight = async (req, res, next) => {
  try {
    await flightService.deleteFlight(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Flight deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
