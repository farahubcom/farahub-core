const { Controller } = require('@farahub/framework/foundation');
const fs = require('fs');
const { ViewResolver } = require('@farahub/framework/facades');


class MainController extends Controller {

    /**
     * The controller name
     * 
     * @var string
     */
    name = 'Main';

    /**
     * The controller routes
     * 
     * @var array
     */
    routes = [
        {
            type: 'web',
            method: 'get',
            path: '/static/*',
            handler: 'static',
        },
        {
            type: 'web',
            method: 'all',
            path: '/*',
            handler: 'home',
        },
    ];

    /**
     * Module views directory name
     * 
     * @var string
     */
    directoryName = 'hub'

    /**
     * Serve landing static files
     * 
     * @returns void
     */
    static() {
        return async function (req, res) {
            const filePath = this.app.getPublicPath(
                fs.existsSync(this.app.getViewsPath(req.workspace.hostname, 'landing')) ?
                    req.workspace.hostname : '',
                'landing',
                req.path
            );

            return fs.existsSync(filePath) ? res.sendFile(filePath) : res.render("404");
        }
    }

    /**
     * Display home page
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    home() {
        return [
            ViewResolver.register(this.app, 'hub'),
            async function (req, res) {
                return res.resolveAndRender(req.path);
            }
        ]
    }
}

module.exports = MainController;