const { CustomError } = require("../middlewares/errorhandler.middleware");
const User = require("../models/user.model");
exports.roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.roles)) {
            return next(new CustomError('Access denied. you do not have the required role', 403));
        }
        next();
    };
};

exports.verifyOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            let resource;
            switch (resourceType) {
                case 'warehouse_owner':
                    resource = await User.findById(req.params.warehouseId);
                    if (!resource) {
                        throw new CustomError('warehouse not found', 404);
                    }
                    if (resource.owner.toString() !== req.user.id) {
                        throw new CustomError('Access denied. You do no own this warehouse', 403);
                    }
                    break;
                case 'farmer':
                    resource = await User.findById(req.params.id);
                    if (!resource) {
                        throw new CustomError('No deposits found');
                    }
                    break;
                default:
                    throw new CustomError('Invalid user type', 400);
            }
            req.resource = resource;
            next();
        } catch (error) {
            next(error);
        }
    };
};