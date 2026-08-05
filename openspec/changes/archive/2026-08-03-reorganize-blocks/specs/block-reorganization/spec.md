## ADDED Requirements

### Requirement: Neural blocks split into subcategories

The `neural` category SHALL be split into 5 subcategories: conv, activation, norm, pool, rnn.

#### Scenario: Neural blocks grouped correctly
- **WHEN** the catalog is generated
- **THEN** `neural_conv` contains conv1d/2d/3d, conv_transpose2d, linear, flatten, embedding, dropout, upsample, input
- **AND** `neural_activation` contains relu, leaky_relu, prelu, gelu, selu, silu, sigmoid, tanh, elu, identity, softmax
- **AND** `neural_norm` contains batchnorm1d/2d, instancenorm2d, layernorm
- **AND** `neural_pool` contains maxpool2d, avgpool2d, adaptive_avgpool2d, adaptive_maxpool2d
- **AND** `neural_rnn` contains rnn, gru, lstm, multihead_attention

#### Scenario: Old neural category gone
- **WHEN** the catalog is generated
- **THEN** there is no single `neural` category containing all 33 blocks

### Requirement: Evaluate merges into training

The `evaluate` block SHALL belong to the `training` category.

#### Scenario: Evaluate in training
- **WHEN** the catalog is generated
- **THEN** `evaluate` appears under the `training` category
- **AND** the `evaluation` category no longer exists

### Requirement: No block logic or name changes

Moving blocks between categories SHALL NOT change block names, types, or logic.

#### Scenario: Block types preserved
- **WHEN** blocks are moved between folders
- **THEN** each block retains its `type` (e.g., `conv2d`, `relu`)
- **AND** its params, inputs, and outputs are unchanged

### Requirement: Frontend renders categories dynamically

The frontend SHALL show the new categories without code changes.

#### Scenario: Catalog-driven categories
- **WHEN** the frontend loads the catalog
- **THEN** it displays whatever categories the backend returns
- **AND** no frontend code references a specific category name
