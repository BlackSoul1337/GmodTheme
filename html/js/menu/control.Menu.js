
if (!IN_ENGINE)
{
	window.util = {
		MotionSensorAvailable: function() { return false; }
	}
}

var gScope = null;
var GamemodeDetails = {}
var MapIndex = {}

var subscriptions = new Subscriptions();

function ClampUIScale( value )
{
	value = parseFloat( value );
	if ( isNaN( value ) ) value = 1;
	if ( value < 0.75 ) value = 0.75;
	if ( value > 1.35 ) value = 1.35;

	return Math.round( value * 100 ) / 100;
}

function MenuController( $scope, $rootScope )
{
	$rootScope.ShowBack = false;
	$scope.Version = "0";
	$scope.ProblemCount = 0;
	$scope.ProblemSeverity = 0;
	$scope.UIScale = 1;
	$scope.ThemeAllGamemodes = false;
	$scope.HideProblems = false;

	subscriptions.Init( $scope );

	gScope = $scope;

	gScope.Gamemode = "";

	$scope.ApplyUIScale = function()
	{
		$scope.UIScale = ClampUIScale( $scope.UIScale );

		// Native zoom keeps text in the browser's layout pipeline and avoids the
		// raster blur produced by scaling the entire body with a transform.
		if ( "zoom" in document.body.style )
		{
			document.body.style.zoom = $scope.UIScale;
			document.body.style.webkitTransform = "";
			document.body.style.width = "";
			document.body.style.height = "";
			return;
		}

		document.body.style.webkitTransformOrigin = "0 0";
		document.body.style.webkitTransform = "scale(" + $scope.UIScale + ")";
		document.body.style.width = ( 100 / $scope.UIScale ) + "%";
		document.body.style.height = ( 100 / $scope.UIScale ) + "%";
	}

	$scope.SetUIScale = function( value )
	{
		$scope.UIScale = ClampUIScale( value );
		$scope.ApplyUIScale();

		// Persist to data/ immediately (survives unclean shutdowns, unlike the
		// cookie store which flushes on exit).
		lua.Run( 'file.Write( "blacksoul_menu_ui_scale.txt", %s )', String( $scope.UIScale ) );
	}

	$scope.ChangeUIScale = function( delta )
	{
		$scope.SetUIScale( $scope.UIScale + delta );
	}

	$scope.ResetUIScale = function()
	{
		$scope.SetUIScale( 1 );
	}

	$scope.GetUIScalePercent = function()
	{
		return Math.round( $scope.UIScale * 100 ) + "%";
	}

	$scope.ToggleThemeSettings = function()
	{
		$( ".popup, .gitpopup" ).not( ".theme-settings" ).hide();

		var popup = $( ".theme-settings" );
		popup.toggle();

		// Anchor the popup to the gear button. getBoundingClientRect() returns
		// real pixels while CSS offsets are scaled by the body zoom factor.
		if ( popup.is( ":visible" ) )
		{
			var gear = $( ".theme-settings-toggle" )[ 0 ].getBoundingClientRect();
			var scale = parseFloat( document.body.style.zoom ) || 1;
			var right = ( document.documentElement.clientWidth - gear.right ) / scale;

			popup.css( "right", Math.max( 8, Math.round( right ) ) + "px" );
		}
	}

	// The menu state has no addon Lua, so the cookie store is the persistence
	// layer and the current value is pulled back through the menu panel.
	$scope.SetThemeAllGamemodes = function()
	{
		// file.Write lands in data/ immediately and is visible to the client
		// realm in the same session; menu-state cookies are not.
		lua.Run( 'file.Write( "blacksoul_theme_all_gamemodes.txt", %s )', $scope.ThemeAllGamemodes ? "1" : "0" );
	}

	$scope.SetHideProblems = function()
	{
		lua.Run( 'file.Write( "blacksoul_hide_problems.txt", %s )', $scope.HideProblems ? "1" : "0" );
	}

	setTimeout( function()
	{
		$scope.ApplyUIScale();
		lua.Run( 'pnlMainMenu:Call( "UpdateUIScale( " .. ( file.Read( "blacksoul_menu_ui_scale.txt", "DATA" ) or cookie.GetString( "blacksoul_menu_ui_scale", "1" ) ) .. " )" )' );
		lua.Run( 'pnlMainMenu:Call( "UpdateThemeAllGamemodes( " .. tostring( ( file.Read( "blacksoul_theme_all_gamemodes.txt", "DATA" ) or cookie.GetString( "blacksoul_theme_all_gamemodes", "0" ) ) == "1" ) .. " )" )' );
		lua.Run( 'pnlMainMenu:Call( "UpdateHideProblems( " .. tostring( ( file.Read( "blacksoul_hide_problems.txt", "DATA" ) or "0" ) == "1" ) .. " )" )' );
	}, 0 );

	$scope.ToggleGamemodes = function()
	{
		$( ".popup, .gitpopup" ).not( ".gamemode_list" ).hide();
		$( ".gamemode_list" ).toggle();
	}

	$scope.ToggleLanguage = function()
	{
		$( ".popup, .gitpopup" ).not( ".language_list" ).hide();
		$( ".language_list" ).toggle();
	}

	$scope.ToggleGames = function()
	{
		$( ".popup, .gitpopup" ).not( ".games_list" ).hide();
		$( ".games_list" ).toggle();
	}

	$scope.TogglePopup = function( name )
	{
		$( ".popup, .gitpopup" ).not( name ).hide();
		$( name ).toggle();
	}

	$scope.SelectGamemode = function( gm )
	{
		$scope.Gamemode = gm.name;
		$scope.GamemodeTitle = gm.title;
		lua.Run( "RunConsoleCommand( \"gamemode\", %s )", gm.name );

		$( ".gamemode_list" ).hide();
	}

	$scope.SelectLanguage = function( lang )
	{
		$rootScope.Language = lang;
		lua.Run( "RunConsoleCommand( \"gmod_language\", %s )", lang );

		$( ".language_list" ).hide();
	}

	$scope.MenuOption = function( btn, v )
	{
		lua.Run( "RunGameUICommand( %s )", v );
	}

	$scope.IfElse = function( b, a, c )
	{
		if ( b ) return a;
		return c;
	}

	//
	// Map List
	//
	$rootScope.MapList = [];
	$rootScope.MapListFav = {};
	$rootScope.AddonMapList = [];
	lua.Run( "UpdateMapList()" );

	//
	// Languages
	//
	$rootScope.Languages = []
	$rootScope.Language = "en";
	lua.Run( "UpdateLanguages()" );

	//
	// Game Mounts
	//
	$scope.GameMountChanged = function( mount )
	{
		var bMount = mount.mounted ? "true" : "false";
		lua.Run( "engine.SetMounted( %s, " + bMount + " )", String( mount.depot ) );
	}

	//
	// Controls
	//
	$scope.BackToGame = function()
	{
		lua.Run( "gui.HideGameUI()" );
	}

	$scope.ToggleServerFavorites = function( bAdd )
	{
		var bAdd = bAdd ? "true" : "false";
		lua.Run( "serverlist.AddCurrentServerToFavorites( " + bAdd + " )" );
	}

	$scope.Disconnect = function()
	{
		lua.Run( "RunConsoleCommand( 'disconnect' )" );
	}

	$scope.OpenWorkshopFile = function( id )
	{
		if ( !id ) return;

		gmod.OpenWorkshopFile( String( id ) );
	}

	$scope.OpenFolder = function( foldername )
	{
		lua.Run( "OpenFolder( %s )", String( foldername ) );
	}

	$scope.OpenWorkshop = function()
	{
		lua.Run( "steamworks.OpenWorkshop()" );
	}

	$scope.ShowNews = function()
	{
		if ( gScope.Branch != "unknown" ) return lua.Run( "gui.OpenURL( 'https://commits.facepunch.com/r/garrysmod.main' )" );

		lua.Run( "gui.OpenURL( 'http://gmod.facepunch.com/changes/' )" );
	}

	$scope.ToggleProblems = function()
	{
		lua.Run( "OpenProblemsPanel()" );
	}

	// InGame
	$scope.InGame = false;
	$scope.ShowFavButton = false;
	$scope.IsCurrentServerFav = false;

	// Kinect options
	$scope.kinect =
	{
		available: util.MotionSensorAvailable(),
		show_color: false,
		color_options: [ "topleft", "topright", "bottomleft", "bottomright" ],
		color: "bottomleft",
		size_options: [ "small", "medium", "large" ],
		color_size:	"medium",

		update: function()
		{
			// Start the kinect
			if ( $scope.kinect.show_color )
			{
				lua.Run( "motionsensor.Start()" );
			}

			if ( $scope.kinect.color == "topleft" )		{ lua.Run( "RunConsoleCommand( \"sensor_color_x\", \"32\" )" ); lua.Run( "RunConsoleCommand( \"sensor_color_y\", \"32\" )" ); }
			if ( $scope.kinect.color == "topright" )	{ lua.Run( "RunConsoleCommand( \"sensor_color_x\", \"-32\" )" ); lua.Run( "RunConsoleCommand( \"sensor_color_y\", \"32\" )" ); }
			if ( $scope.kinect.color == "bottomright" )	{ lua.Run( "RunConsoleCommand( \"sensor_color_x\", \"-32\" )" ); lua.Run( "RunConsoleCommand( \"sensor_color_y\", \"-32\" )" ); }
			if ( $scope.kinect.color == "bottomleft" )	{ lua.Run( "RunConsoleCommand( \"sensor_color_x\", \"32\" )" ); lua.Run( "RunConsoleCommand( \"sensor_color_y\", \"-32\" )" ); }

			if ( $scope.kinect.color_size == "small" ) { lua.Run( "RunConsoleCommand( \"sensor_color_scale\", \"0.4\" )" ); }
			if ( $scope.kinect.color_size == "medium" ) { lua.Run( "RunConsoleCommand( \"sensor_color_scale\", \"0.7\" )" ); }
			if ( $scope.kinect.color_size == "large" ) { lua.Run( "RunConsoleCommand( \"sensor_color_scale\", \"1.0\" )" ); }

			lua.Run( "RunConsoleCommand( \"sensor_color_show\", %s )", $scope.kinect.show_color ? "1" : "0" );
		}
	}

	util.MotionSensorAvailable( function( available ) {
		$scope.kinect.available = available;
	} );
}

function SetInGame( bInGame )
{
	gScope.InGame = bInGame;
	UpdateDigest( gScope, 50 );
}

function SetShowFavButton( bShow, bFav )
{
	gScope.ShowFavButton = bShow;
	gScope.IsCurrentServerFav = bFav;
	UpdateDigest( gScope, 50 );
}

function UpdateGamemodes( gm )
{
	gScope.Gamemodes = [];
	for ( var k in gm )
	{
		var gi = GetGamemodeInfo( gm[k].name );
		gi.title = gm[k].title
		gi.name = gm[k].name

		gScope.Gamemodes.push( gm[k] );
	}

	UpdateDigest( gScope, 50 );
}

function UpdateCurrentGamemode( gm )
{
	if ( gScope.Gamemode == gm ) return;

	gScope.Gamemode = gm;

	for ( var k in gScope.Gamemodes )
	{
		if ( gScope.Gamemodes[k].name == gm )
			gScope.GamemodeTitle = gScope.Gamemodes[k].title;
	}

	UpdateDigest( gScope, 50 );
}

function GetGamemodeInfo( name )
{
	var nameL = name.toLowerCase();
	if ( !GamemodeDetails[nameL] ) GamemodeDetails[nameL] = { title: name, name: nameL }

	return GamemodeDetails[nameL];
}

function ResetGamemodeInfo()
{
	GamemodeDetails = {};
}

function UpdateAddonMaps( inmaps )
{
	gScope.AddonMapList = inmaps;
	UpdateDigest( gScope, 50 );
}

function UpdateMaps( inmaps )
{
	var mapList = [];
	var favList = {};

	for ( var k in inmaps )
	{
		var order = k;
		if ( k == "Sandbox" ) order = "2";
		if ( k == "Favourites" ) order = "1";

		var maps = []
		for ( var v in inmaps[k] )
		{
			maps.push( inmaps[k][v] );
			MapIndex[ inmaps[k][v].toLowerCase() ] = true;
			if ( k == "Favourites" ) favList[ inmaps[k][v].toLowerCase() ] = true;
		}

		mapList.push(
		{
			order: order,
			category: k,
			maps: maps
		} )
	}

	gScope.MapList = mapList;
	gScope.MapListFav = favList;
	UpdateDigest( gScope, 50 );
}

function DoWeHaveMap( map )
{
	return MapIndex[map.toLowerCase()] || false;
}

function UpdateLanguages( lang )
{
	gScope.Languages = [];

	for ( var k in lang )
	{
		gScope.Languages.push( lang[k].substr( 0, lang[k].length - 4 ) )
	}
}

function UpdateLanguage( lang )
{
	gScope.Language = lang;
	gScope.$broadcast( "languagechanged" );
	UpdateDigest( gScope, 50 );
}

function UpdateGames( games )
{
	gScope.Games = [];

	for ( var k in games )
	{
		games[k].mounted	= games[k].mounted == 1;
		games[k].installed	= games[k].installed == 1;
		games[k].owned		= games[k].owned == 1;

		gScope.Games.push( games[k] )
	}

	UpdateDigest( gScope, 50 );
}

function UpdateVersion( version, netVersion, branch )
{
	GMOD_VERSION_INT = parseInt( netVersion.replace( /\./g, "" ) ); // For server browser

	gScope.Version	= version;
	gScope.Branch	= branch;

	UpdateDigest( gScope, 100 );
}

function SetProblemCount( num, severity )
{
	gScope.ProblemCount		= num;
	gScope.ProblemSeverity	= severity;

	UpdateDigest( gScope, 100 );
}

// Pulled from the cookie store via Lua (pnlMainMenu:Call) so the persisted
// setting is the single source of truth for the checkbox state.
function UpdateThemeAllGamemodes( bEnabled )
{
	gScope.ThemeAllGamemodes = bEnabled == true || bEnabled == "true";
	UpdateDigest( gScope, 50 );
}

function UpdateHideProblems( bEnabled )
{
	gScope.HideProblems = bEnabled == true || bEnabled == "true";
	UpdateDigest( gScope, 50 );
}

// Pulled from the cookie store via Lua (pnlMainMenu:Call) so the saved scale
// survives restarts even when the menu browser keeps no localStorage.
function UpdateUIScale( value )
{
	gScope.UIScale = ClampUIScale( value );
	gScope.ApplyUIScale();
	UpdateDigest( gScope, 50 );
}

//
// Setup sounds..
//
var gmodInteractiveSoundSelector = [
	".options a",
	".noisy",
	".mainmenu a",
	"#version",
	"#NavBar .button",
	".gitpopup li",
	".gamemode",
	".serverlist .server",
	".serverinfo button",
	".bglink",
	".installgamemode",
	".favbutton",
	"UL.category LI.mapicon",
	".dropdown .label",
	".dropdown .contents div",
	"gamesettings bottom button",
	"div.centermessage a",
	"div.centermessage .button",
	"control",
	"workshopicon",
	".theme-settings-toggle",
	".theme-settings button",
	".theme-settings input",
	".news_buttons div",
	"label[for]"
].join( ", " );

function IsReturnSoundElement( element )
{
	return $( element ).closest( ".ui_sound_return" ).length > 0;
}

$( document ).on( "mouseenter", gmodInteractiveSoundSelector, function()
{
	if ( IsReturnSoundElement( this ) ) return;
	lua.PlaySound( "garrysmod/ui_hover.wav" );
} );

$( document ).on( "click", gmodInteractiveSoundSelector, function()
{
	if ( IsReturnSoundElement( this ) ) return;
	lua.PlaySound( "garrysmod/ui_click.wav" );
} );

$( document ).on( "mouseenter", ".ui_sound_return", function()
{
	lua.PlaySound( "garrysmod/ui_hover.wav" );
} );

$( document ).on( "click", ".ui_sound_return", function()
{
	lua.PlaySound( "garrysmod/ui_return.wav" );
} );
