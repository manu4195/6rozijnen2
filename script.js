document.addEventListener('DOMContentLoaded', function() {
    const dashboardNav = document.getElementById('dashboard-nav');
    const personalizeNav = document.getElementById('personalize-nav');
    const dashboardView = document.getElementById('dashboard-view');
    const personalizeView = document.getElementById('personalize-view');
    
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Fetch widgets from the PHP API
    async function fetchWidgets() {
        try {
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const widgets = await response.json();
            
                widgets.forEach(widget => {
                });
                
            syncDashboardWithPersonalize();
            
        } catch (error) {
            console.error('Error fetching widgets:', error);
        }
    }
    
            
            }
            
        }
    }
    
        
        widgets.forEach(widget => {
            
    }
    
        }
        
        
            e.preventDefault();
        
                syncDashboardWithPersonalize();
                
                
            }
        }
    
        
        
        
    }
    
        
    }
    
                
                
            });
            
            
    }
    
    
        
        
        }
        
        
        
            
            
            
            
            
                            }
                                }
                            }
                        }
                    }
                }
            });
            
        } else {
        }
    }
    
        
        }
    }
    
                        return {
                        };
                    });
                    
        try {
                });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            syncDashboardWithPersonalize();
            
            
        } catch (error) {
        }
    }
    
        fetchWidgets();
        
        }
});