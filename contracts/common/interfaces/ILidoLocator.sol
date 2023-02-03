// SPDX-FileCopyrightText: 2023 Lido <info@lido.fi>

// SPDX-License-Identifier: GPL-3.0

// See contracts/COMPILERS.md
// solhint-disable-next-line
pragma solidity 0.4.24||0.8.9;

interface ILidoLocator {
    function accountingOracle() external view returns(address);
    function depositSecurityModule() external view returns(address);
    function elRewardsVault() external view returns(address);
    function legacyOracle() external view returns(address);
    function lido() external view returns(address);
    function safetyNetsRegistry() external view returns(address);
    function selfOwnedStEthBurner() external view returns(address);
    function stakingRouter() external view returns(address);
    function treasury() external view returns(address);
    function validatorExitBus() external view returns(address);
    function withdrawalQueue() external view returns(address);
    function withdrawalVault() external view returns(address);
    function rebaseReceiver() external view returns(address);
    function coreComponents() external view returns(
        address elRewardsVault,
        address safetyNetsRegistry,
        address stakingRouter,
        address treasury,
        address withdrawalQueue,
        address withdrawalVault
    );
}
