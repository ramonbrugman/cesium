/*global define*/
define(['../createCommand',
        '../../Core/defaultValue',
        '../../Core/Cartesian3',
        '../../Core/DeveloperError',
        '../../Core/Ellipsoid',
        '../../Core/Extent',
        '../../Core/Math',
        '../../Core/Matrix4',
        '../../Scene/Camera',
        '../../Scene/CameraColumbusViewMode',
        '../../Scene/PerspectiveFrustum',
        '../../Scene/SceneMode',
        '../../ThirdParty/knockout'
        ], function(
            createCommand,
            defaultValue,
            Cartesian3,
            DeveloperError,
            Ellipsoid,
            Extent,
            CesiumMath,
            Matrix4,
            Camera,
            CameraColumbusViewMode,
            PerspectiveFrustum,
            SceneMode,
            knockout) {
    "use strict";

    function viewHome(scene, ellipsoid, transitioner) {
        var mode = scene.mode;

        var camera = scene.getCamera();
        camera.controller.constrainedAxis = Cartesian3.UNIT_Z;

        var controller = scene.getScreenSpaceCameraController();
        controller.enableTranslate = true;
        controller.enableTilt = true;
        controller.setEllipsoid(ellipsoid);
        controller.columbusViewMode = CameraColumbusViewMode.FREE;

        var canvas = scene.getCanvas();
        if (typeof transitioner !== 'undefined' && mode === SceneMode.MORPHING) {
            transitioner.completeMorph();
        }

        if (mode === SceneMode.SCENE2D) {
            camera.controller.viewExtent(Extent.MAX_VALUE);
        } else if (mode === SceneMode.SCENE3D) {
            var defaultCamera = new Camera(canvas);
            defaultCamera.position.clone(camera.position);
            defaultCamera.direction.clone(camera.direction);
            defaultCamera.up.clone(camera.up);
            defaultCamera.right.clone(camera.right);
            defaultCamera.transform.clone(camera.transform);
            defaultCamera.frustum.clone(camera.frustum);
        } else if (mode === SceneMode.COLUMBUS_VIEW) {
            var transform = new Matrix4(0.0, 0.0, 1.0, 0.0,
                                        1.0, 0.0, 0.0, 0.0,
                                        0.0, 1.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 1.0);

            var maxRadii = ellipsoid.getMaximumRadius();
            var position = new Cartesian3(0.0, -1.0, 1.0).normalize().multiplyByScalar(5.0 * maxRadii);
            var direction = Cartesian3.ZERO.subtract(position).normalize();
            var right = direction.cross(Cartesian3.UNIT_Z);
            var up = right.cross(direction);
            right = direction.cross(up);
            direction = up.cross(right);

            var frustum = new PerspectiveFrustum();
            frustum.fovy = CesiumMath.toRadians(60.0);
            frustum.aspectRatio = canvas.clientWidth / canvas.clientHeight;

            camera.position = position;
            camera.direction = direction;
            camera.up = up;
            camera.right = right;
            camera.frustum = frustum;
            camera.transform = transform;
        }
    }

    /**
     * The ViewModel for {@link HomeButton}.
     * @alias HomeButtonViewModel
     * @constructor
     *
     * @param {Scene} scene The Scene instance to use.
     * @param {SceneTransitioner} [transitioner] The SceneTransitioner instance to use.
     * @param {Ellipsoid} [ellipsoid] The Scene's primary ellipsoid.
     *
     * @exception {Scene} scene is required.
     */
    var HomeButtonViewModel = function(scene, transitioner, ellipsoid) {
        if (typeof scene === 'undefined') {
            throw new DeveloperError('scene is required.');
        }

        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

        this._scene = scene;
        this._ellipsoid = ellipsoid;
        this._transitioner = transitioner;

        /**
         * Flies to the home view of the current scene.
         * @type Command
         */
        this.command = createCommand(function() {
            viewHome(scene, ellipsoid, transitioner);
        });

        /**
         * Gets an Observable indicating the current tooltip.
         * @type Observable
         */
        this.tooltip = knockout.observable('View Home');
    };

    /**
     * Gets the scene.
     * @type Observable
     */
    HomeButtonViewModel.prototype.getScene = function() {
        return this._scene;
    };

    /**
     * Gets the primary ellipsoid for the scene.
     * @type Observable
     */
    HomeButtonViewModel.prototype.getEllipsoid = function() {
        return this._ellipsoid;
    };

    /**
     * Gets the scene transitioner being used by the host application.
     * If a transitioner is assigned, any running morphs will be completed
     * when the home button is pressed.
     * @type Observable
     */
    HomeButtonViewModel.prototype.getTransitioner = function() {
        return this._transitioner;
    };

    return HomeButtonViewModel;
});
