<?php

namespace mrssoft\mrs2000box;

use yii\web\AssetBundle;

class Asset extends AssetBundle
{
    public $sourcePath = '@vendor/mrssoft/yii2-mrs2000box/assets';

    public $css = [
        'mrs2000box.css',
    ];

    public $js = [
        'jquery.mrs2000box.min.js',
    ];

    public $depends = [
        'yii\web\JqueryAsset'
    ];
}