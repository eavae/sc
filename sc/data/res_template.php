<?php 
  class CssJs_Util_%###%templateName%###%
   {
      private static $cssStr = %###%css%###%;  // css字串，不含<style>和</style>标签
      private static $jsStr  = %###%js%###%;   // js字串，不含<script标签
      private static $uiList = %###%ui%###%;   // 包含的组件，以','分割的字符串，比如'input,text,button'这样
      
      public static function getHeadCss()
      {
         if (!is_string(self::$cssStr))
         {
            return '';
         }
         return self::$cssStr;
      }
      
      public static function getFootJs()
      {
         if (!is_string(self::$jsStr))
         {
            return '';
         }
         return self::$jsStr;
      }
      
      // 返回数组
      public static function getCssUI()
      {
		 if ( empty(self::$uiList) ) return array();

         $arr = @explode(',', self::$uiList);
         if (!is_array($arr))
         {
            $arr = array();
         }
         return $arr;
      }
   }
