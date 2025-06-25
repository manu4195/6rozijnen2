<?php
// Start session
session_start();

// Default user ID (in a real app, this would come from the session)
$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;

// Check which view to show
$activeView = isset($_GET['view']) && $_GET['view'] === 'personalize' ? 'personalize' : 'dashboard';

// Dummy user info for demo
$userInfo = [
    'name' => 'Demo User',
    'email' => 'demo@example.com',
    'plan' => 'Premium',
    'avatar' => 'https://ui-avatars.com/api/?name=Demo+User&background=random'
];
?>
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Energy Dashboard</title>
    <!-- Core CSS -->
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- GridStack CSS for grid layout and drag-drop -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/gridstack@7.2.3/dist/gridstack.min.css">
    
    <!-- Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/gridstack@7.2.3/dist/gridstack-all.js"></script>
    
    <!-- Custom scripts -->
    <script src="widget-grid.js"></script>
    <script src="script.js"></script>
    <script>
        // Global variables
        const USER_ID = <?php echo $userId; ?>;
        let ACTIVE_VIEW = "<?php echo $activeView; ?>";
        
        // Make ACTIVE_VIEW globally mutable
        window.ACTIVE_VIEW = ACTIVE_VIEW;
    </script>
</head>

<body>
    <div class="container">
        <aside class="sidebar">
            <div class="logo-container">
                <div class="logo">R</div>
                <span class="logo-text">Rozijnen</span>
                <button class="menu-toggle"><i class="fas fa-bars"></i></button>
            </div>
            
            <nav class="nav-menu">
                <a href="?view=dashboard" class="nav-item <?php echo $activeView == 'dashboard' ? 'active' : ''; ?>" id="dashboard-nav">
                    <i class="fas fa-chart-line"></i>
                    <span>Dashboard</span>
                </a>
                <a href="?view=personalize" class="nav-item <?php echo $activeView == 'personalize' ? 'active' : ''; ?>" id="personalize-nav">
                    <i class="fas fa-sliders-h"></i>
                    <span>Personalize</span>
                </a>
                <a href="?view=tips" class="nav-item <?php echo $activeView == 'tips' ? 'active' : ''; ?>">
                    <i class="far fa-lightbulb"></i>
                    <span>Tips</span>
                </a>
                <a href="?view=settings" class="nav-item <?php echo $activeView == 'settings' ? 'active' : ''; ?>">
                    <i class="fas fa-cog"></i>
                    <span>Settings</span>
                </a>
            </nav>
            
            <div class="user-profile">
                <img src="<?php echo htmlspecialchars($userInfo['avatar']); ?>" alt="User Profile" class="profile-img">
                <div class="profile-info">
                    <p class="profile-name"><?php echo htmlspecialchars($userInfo['name']); ?></p>
                    <p class="profile-role"><?php echo htmlspecialchars($userInfo['plan']); ?></p>
                </div>
            </div>
        </aside>
        
        <main class="main-content">
            <!-- Dashboard View -->
            <div id="dashboard-view" class="view-container" <?php echo $activeView != 'dashboard' ? 'style="display: none;"' : ''; ?>>
                <header class="dashboard-header">
                    <div class="title-container">
                        <h1>Energy Dashboard</h1>
                        <p>Overzicht van uw energieverbruik en -opwekking</p>
                    </div>
                    <div class="header-actions">
                        <div class="dropdown">
                            <button class="dropdown-btn">Vandaag <i class="fas fa-chevron-down"></i></button>
                        </div>
                        <button class="export-btn"><i class="fas fa-download"></i> Export Data</button>
                    </div>
                </header>
                
                <div id="dashboard-grid" class="grid-stack">
                    <!-- Dashboard content will be loaded here -->
                </div>
            </div>
            
            <!-- Personalize View -->
            <div id="personalize-view" class="view-container" <?php echo $activeView != 'personalize' ? 'style="display: none;"' : ''; ?>>
                <header class="dashboard-header">
                    <div class="title-container">
                        <h1>Personalize Dashboard</h1>
                        <p>Creëer je eigen dashboard layout</p>
                    </div>
                    <div class="header-actions">
                        <div class="dropdown">
                            <button class="dropdown-btn">Vandaag <i class="fas fa-chevron-down"></i></button>
                        </div>
                        <div class="widget-toolbar">
                            <button class="add-widget-btn"><i class="fas fa-plus"></i> Add Widget</button>
                            <button class="save-changes-btn"><i class="fas fa-save"></i> Save Changes</button>
                        </div>
                        <button class="export-btn"><i class="fas fa-download"></i> Export Data</button>
                    </div>
                </header>
                
                <div class="personalize-instructions">
                    <div class="instructions-card">
                        <i class="fas fa-info-circle"></i>
                        <div class="instructions-text">
                            <strong>Tip:</strong> Sleep widgets om ze te verplaatsen, verander de grootte door aan de hoeken te slepen, 
                            of verberg widgets met de <i class="fas fa-eye-slash"></i> knop.
                        </div>
                    </div>
                </div>
                
                <div id="personalize-grid" class="grid-stack">
                    <!-- Personalize content will be loaded here -->
                </div>
            </div>
        </main>
    </div>
    
    <!-- Widget Selection Modal -->
    <div id="widget-selection-modal" class="modal" style="display: none;">
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> Add Widget</h2>
                <button class="close-modal" type="button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="modal-section">
                    <h3>Available Widgets</h3>
                    <div class="widget-types">
                        <!-- Widget types will be loaded here -->
                        <div class="loading-placeholder">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading available widgets...</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary close-modal" type="button">Cancel</button>
            </div>
        </div>
    </div>
    
    <!-- Notification Container -->
    <div id="notification-container"></div>
</body>
</html>