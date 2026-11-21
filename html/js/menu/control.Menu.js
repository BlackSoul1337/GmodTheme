
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

	// The dim overlay lives on <html>, outside the zoomed body: body zoom
	// scales fixed-position descendants and would leave undimmed strips.
	$rootScope.$on( "$viewContentLoaded", function()
	{
		var cl = document.documentElement.classList;
		if ( document.querySelector( "DIV.page" ) ) cl.add( "subpage" );
		else cl.remove( "subpage" );
	} );

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

		// Menu-state cookies commit to mn.db within ~0.1s; file.Write is
		// sandboxed read-only in the menu state.
		lua.Run( 'cookie.Set( "blacksoul_menu_ui_scale", %s )', String( $scope.UIScale ) );
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

	// Cookies (mn.db) keep the menu UI state across restarts. The concommand
	// mirrors the scope toggle into the client realm, which owns the convar.
	$scope.SetThemeAllGamemodes = function()
	{
		var value = $scope.ThemeAllGamemodes ? "1" : "0";
		lua.Run( 'cookie.Set( "blacksoul_theme_all_gamemodes", %s )', value );
		lua.Run( 'RunConsoleCommand( "blacksoul_theme_all_gamemodes", %s )', value );
	}

	$scope.SetHideProblems = function()
	{
		lua.Run( 'cookie.Set( "blacksoul_hide_problems", %s )', $scope.HideProblems ? "1" : "0" );
	}

	$scope.RecentServers = [];
	$scope.RecentServersLoading = true;

	$scope.UpdateRecentServers = function()
	{
		if ( !ServerTypes['history'] || !ServerTypes['history'].gamemodes )
		{
			$scope.RecentServers = [];
			$scope.RecentServersLoading = true;
			return;
		}

		var allServers = [];
		for ( var gmName in ServerTypes['history'].gamemodes )
		{
			var gm = ServerTypes['history'].gamemodes[ gmName ];
			if ( gm.servers && gm.servers.length > 0 )
				allServers = allServers.concat( gm.servers );
		}

		allServers.sort( function( a, b ) { return ( b.lastplayed || 0 ) - ( a.lastplayed || 0 ); } );

		$scope.RecentServers = allServers.slice( 0, 5 );
		$scope.RecentServersLoading = false;
		UpdateDigest( $scope, 50 );
	}

	$scope.JoinRecentServer = function( server )
	{
		clearInterval( UpdateInterval );

		if ( server.password )
			lua.Run( "RunConsoleCommand( \"password\", %s )", server.password );

		lua.Run( "JoinServer( %s )", server.address );
	}

	setTimeout( function()
	{
		$scope.ApplyUIScale();
		lua.Run( 'pnlMainMenu:Call( "UpdateUIScale( " .. cookie.GetString( "blacksoul_menu_ui_scale", "1" ) .. " )" )' );
		lua.Run( 'pnlMainMenu:Call( "UpdateThemeAllGamemodes( " .. tostring( cookie.GetString( "blacksoul_theme_all_gamemodes", "0" ) == "1" ) .. " )" )' );
		lua.Run( 'pnlMainMenu:Call( "UpdateHideProblems( " .. tostring( cookie.GetString( "blacksoul_hide_problems", "0" ) == "1" ) .. " )" )' );
		PreloadHistoryAtBoot();
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

// Pulled from the menu cookie store via Lua (pnlMainMenu:Call) so the persisted
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

// Pulled from the menu cookie store via Lua (pnlMainMenu:Call) so the saved
// scale survives restarts even when the menu browser keeps no localStorage.
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
	"#RecentServers .server-item",
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
