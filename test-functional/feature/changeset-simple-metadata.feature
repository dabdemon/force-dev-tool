Feature: Change Set: Handle Properties of Simple Metadata Types

  Scenario Outline: Simple metadata are added, updated
    Given a list of "<simple>" metadata in "<data>" folder which has been changed in a git repository
     When a user launches a change set with force-dev-tool
     Then it will create a change set with all "<simple>" metadata
      And the change set could be deployed correctly

    Examples:
      | simple        | data                                        |
      | PermissionSet | simple-metadata/permissionSet-changed       |
      | PermissionSet | simple-metadata/permissionSet-added-desc    |
      | Profile       | simple-metadata/profile-layout-assignments  |
      | Profile       | simple-metadata/profile-custom-settings     |
      | Profile       | simple-metadata/profile-description-changed |
      | QuickAction   | simple-metadata/quickAction-added           |
      | Prompt        | simple-metadata/prompt-updated              |

  Scenario Outline: Simple metadata are removed
    Given a list of "<simple>" metadata in "<data>" folder which has been changed in a git repository
     When a user launches a change set with force-dev-tool
      And it will create a destructive change with the list of removed "<simple>" metadata
      And the change set could be deployed correctly

    Examples:
      | simple        | data                                       |
      | Prompt        | simple-metadata/prompt-removed             |


  Scenario Outline: Simple metadata are added, updated and removed
    Given a list of "<simple>" metadata in "<data>" folder which has been changed in a git repository
     When a user launches a change set with force-dev-tool
     Then it will create a change set with all "<simple>" metadata
      And it will create a destructive change with the list of removed "<simple>" metadata
      And the change set could be deployed correctly

    Examples:
      | simple        | data                                       |
      | PermissionSet | simple-metadata/permissionSet-list-changed |
      | Report        | simple-metadata/report-folders             |

  Scenario Outline: Invalid metadata are added
    Given a list of "<simple>" metadata in "<data>" folder which has been changed in a git repository
     When a user launches a change set with force-dev-tool
     Then it will create a change set with all "<simple>" metadata
      And the change set must fail when it is deployed

    Examples:
      | simple        | data                                                |
      | PermissionSet | simple-metadata/permissionSet-added-invalidmetadata |
