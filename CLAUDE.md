# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FoundryVTT module called "Fate Hybrid Skills" that extends the Fate Core Official system to support hybrid skill/approach mechanics. It allows characters to use both approaches (from Fate Accelerated Edition) and skills (from Fate Core) together in a two-column system.

## Architecture

### Module Structure
- **fhs.js**: Main entry point that initializes hooks and settings
- **scripts/**: Core functionality organized by purpose
  - **Models.js**: Data models (Approach class using Foundry DataModel)
  - **Actor.js**: Actor extensions and approach management
  - **Hooks.js**: FoundryVTT hooks for initialization and rendering
  - **Settings.js**: Module settings registration and management
  - **Constants.js**: Module constants (MODULE_ID, MODULE_NAME, SCHEMA_VERSION)
  - **ApproachSetup.js**: GM interface for configuring approaches
  - **EditApproach.js**: Individual approach editing interface
  - **EditGMApproaches.js**: GM approach management
  - **EditPlayerApproaches.js**: Player approach editing
  - **Helper.js**: Utility functions
  - **Log.js**: Logging utilities
- **templates/**: Handlebars templates for UI components
- **lang/**: Internationalization files
- **assets/**: CSS styling

### Key Components

#### Approach System
- Uses FoundryVTT's DataModel for the Approach class (scripts/Models.js:1)
- Approaches stored in actor flags under 'fate-hybrid-skills'
- Each approach has name, description, overcome/caa/attack/defend actions, rank, and metadata
- Supports both PC (player character) and GM-only approaches

#### Integration Points
- Hooks into Fate Core Official system character sheets
- Modifies character sheet rendering to add approach column
- Intercepts actor creation to initialize approaches
- Extends CONFIG.Actor.documentClass with custom Actor class

#### Settings Management
- World-scoped settings for approaches configuration
- GM-only approach setup interface
- Support for default approach sets (Fate Accelerated, Dresden Files Accelerated)
- Configurable approach sorting and labeling

## Development Notes

### No Build System
This module uses vanilla JavaScript ES modules with no build process. All files are served directly to FoundryVTT.

### FoundryVTT Integration
- Requires "fate-core-official" system as dependency
- Uses FoundryVTT v12 compatibility
- Leverages FoundryVTT's hook system, settings API, and templating engine
- Extends core Actor class for approach functionality

### File Organization
- All JavaScript files use ES6 modules with explicit imports/exports
- Templates in `/templates/` directory use Handlebars (.hbs) format
- CSS in `/assets/style.css` for module-specific styling
- Internationalization strings in `/lang/en.json`

### Key Patterns
- Heavy use of FoundryVTT hooks for lifecycle management
- Settings-driven configuration with GM interfaces
- Flag-based data storage on actor documents
- Template-based UI rendering with event handlers